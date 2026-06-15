-- Dados iniciais para o protótipo funcional do FindBus.
-- Execute depois do schema.sql.

insert into public.routes (name, description, active)
values
  ('Rota UFC Campus Quixadá', 'Rodoviária • Centro • UFC', true),
  ('Rota Universitária Centro', 'Centro • IFCE • Unicatólica • UFC', true),
  ('Rota Noturna Universitária', 'UFC • Terminal • Bairros', true)
on conflict (name) do update set
  description = excluded.description,
  active = excluded.active;

insert into public.vehicles (plate, model, capacity, active)
values
  ('QXD-2026', 'Ônibus Universitário 01', 45, true),
  ('UNI-1045', 'Micro-ônibus Centro', 32, true),
  ('BUS-3310', 'Ônibus Noturno', 40, true)
on conflict (plate) do update set
  model = excluded.model,
  capacity = excluded.capacity,
  active = excluded.active;

insert into public.stops (route_id, name, latitude, longitude, sequence_order)
select r.id, s.name, s.latitude, s.longitude, s.sequence_order
from public.routes r
join (
  values
    ('Rota UFC Campus Quixadá', 'Rodoviária de Quixadá', -4.9709, -39.0157, 1),
    ('Rota UFC Campus Quixadá', 'Centro de Quixadá', -4.9703, -39.0169, 2),
    ('Rota UFC Campus Quixadá', 'UFC Campus Quixadá', -4.9792, -39.0553, 3),
    ('Rota Universitária Centro', 'Praça José de Barros', -4.9694, -39.0153, 1),
    ('Rota Universitária Centro', 'IFCE Quixadá', -4.9671, -39.0084, 2),
    ('Rota Universitária Centro', 'Unicatólica', -4.9801, -39.0256, 3),
    ('Rota Universitária Centro', 'UFC Campus Quixadá', -4.9792, -39.0553, 4),
    ('Rota Noturna Universitária', 'UFC Campus Quixadá', -4.9792, -39.0553, 1),
    ('Rota Noturna Universitária', 'Terminal Rodoviário', -4.9709, -39.0157, 2),
    ('Rota Noturna Universitária', 'Bairros Universitários', -4.9758, -39.0285, 3)
) as s(route_name, name, latitude, longitude, sequence_order)
  on s.route_name = r.name
where not exists (
  select 1 from public.stops existing
  where existing.route_id = r.id and existing.name = s.name
);

insert into public.trips (route_id, vehicle_id, status, current_lat, current_lng, eta_next_stop, started_at)
select r.id, v.id, t.status, t.current_lat, t.current_lng, t.eta_next_stop, now()
from public.routes r
join (
  values
    ('Rota UFC Campus Quixadá', 'QXD-2026', 'in_transit', -4.9728::double precision, -39.0210::double precision, 'Chegada estimada em 8 min'),
    ('Rota Universitária Centro', 'UNI-1045', 'delayed', -4.9685::double precision, -39.0159::double precision, 'Atraso aproximado de 12 min'),
    ('Rota Noturna Universitária', 'BUS-3310', 'waiting', -4.9792::double precision, -39.0553::double precision, 'Saída prevista às 18:20')
) as t(route_name, plate, status, current_lat, current_lng, eta_next_stop)
  on t.route_name = r.name
join public.vehicles v
  on v.plate = t.plate
where not exists (
  select 1 from public.trips existing
  where existing.route_id = r.id and existing.vehicle_id = v.id and existing.status = t.status
);

insert into public.occurrences (route_id, type, description, status)
select r.id, o.type, o.description, o.status
from public.routes r
join (
  values
    ('Rota Universitária Centro', 'crowding', 'Superlotação reportada no horário de pico.', 'open'),
    ('Rota UFC Campus Quixadá', 'delay', 'Atraso recorrente informado por estudantes.', 'in_review')
) as o(route_name, type, description, status)
  on o.route_name = r.name
where not exists (
  select 1 from public.occurrences existing
  where existing.route_id = r.id and existing.description = o.description
);

insert into public.service_ratings (route_id, rating, punctuality, comfort, communication, comment)
select r.id, a.rating, a.punctuality, a.comfort, a.communication, a.comment
from public.routes r
join (
  values
    ('Rota UFC Campus Quixadá', 5, 82, 70, 88, 'Boa previsibilidade no deslocamento.'),
    ('Rota Universitária Centro', 3, 61, 58, 80, 'Precisa melhorar a lotação.'),
    ('Rota Noturna Universitária', 4, 74, 66, 90, 'Comunicação boa sobre horários.')
) as a(route_name, rating, punctuality, comfort, communication, comment)
  on a.route_name = r.name
where not exists (
  select 1 from public.service_ratings existing
  where existing.route_id = r.id and existing.comment = a.comment
);
