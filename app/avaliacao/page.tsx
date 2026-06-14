'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function Avaliacao() {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleEnviarAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nota === 0) {
      alert("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    const { error } = await supabase.from('service_evaluations').insert({
      rating: nota,
      comment: comentario,
      // user_id: 'ID_DO_USUARIO_AQUI' -> Será preenchido com o auth
    });

    if (!error) {
      setEnviado(true);
    } else {
      alert("Erro ao enviar avaliação.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 relative">
        <Link href="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={24} />
        </Link>

        {enviado ? (
          <div className="text-center space-y-4 py-8">
            <CheckCircle size={64} className="text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">Avaliação Recebida!</h2>
            <p className="text-gray-500">Obrigado por ajudar a melhorar o transporte de Quixadá.</p>
            <Link href="/" className="inline-block mt-4 bg-emerald-500 text-white px-6 py-2 rounded-md hover:bg-emerald-600 font-semibold transition-colors">
              Voltar ao Mapa
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8 mt-4">
              <h1 className="text-2xl font-bold text-gray-800">Avalie o Transporte</h1>
              <p className="text-gray-500 text-sm mt-2">Sua opinião é fundamental para modernizar o sistema.</p>
            </div>

            <form onSubmit={handleEnviarAvaliacao} className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">Como você avalia a viagem de hoje?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNota(star)}
                      className={`p-1 transition-colors ${nota >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                    >
                      <Star fill={nota >= star ? 'currentColor' : 'none'} size={36} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MessageSquare size={16} className="text-emerald-500" /> 
                  Comentários adicionais (opcional)
                </label>
                <textarea 
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[120px] resize-none"
                  placeholder="Deixe um elogio, sugestão ou crítica..."
                />
              </div>

              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-md transition-colors text-lg shadow-sm">
                Enviar Avaliação
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}