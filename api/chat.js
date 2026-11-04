module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userMessage } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Kunci GEMINI_API_KEY belum terbaca di Vercel.' });
    }

    // Pesan ramah saat API sibuk atau limit kuota
    const FALLBACK_RESPONSE = `Halo! Saat ini sistem antrean AI sedang cukup padat. 

Namun jangan khawatir, Anda tetap bisa menjelajahi portofolio Yusuf secara manual:
• 🌊 **FloodSight**: Sistem AI & Geospasial untuk prediksi banjir JABODETABEK.
• 🏍️ **Skripsi AST CVT**: Pemodelan Predictive Maintenance kerusakan CVT motor menggunakan Audio Spectrogram Transformer.
• 🏅 **Riset NICYMS**: Penelitian NLP & Teori Informasi (Gold Medal Winner).

Silakan coba sapa saya lagi dalam 2–3 menit, ya!`;

    const systemPrompt = `
    Kamu adalah Asisten AI untuk portofolio kandidat S1 Teknik Informatika UIN Sunan Gunung Djati Bandung.
    Data Kandidat:
    - Spesialisasi: Artificial Intelligence, Data Engineering, & Data Analytics.
    - Skripsi: Klasifikasi Kerusakan Area CVT Sepeda Motor Matic Menggunakan Metode Audio Spectrogram Transformer (AST) pada PyTorch.
    - Proyek DBS: FloodSight (Sistem Prediksi Banjir JABODETABEK berbasis CNN Hybrid dengan citra satelit Google Earth Engine + data tabular, Nilai akhir: 87.8).
    - Kompetisi: Gold Medal NICYMS / ICYMS (Riset Komputasional Pola Kata Al-Qur'an).
    - Pengalaman Kerja: Live Streamer & Sales Specialist (komunikasi publik, pemahaman algoritma platform, target sales).
    - Pengalaman Riset: Pengambilan sampel data audio mesin mentah di lapangan secara mandiri.

    Tugasmu: Jawab pertanyaan HR dengan ramah, profesional, ringkas (maksimal 3-4 kalimat), dan jujur berdasarkan data kandidat di atas. Jika ditanya hal di luar konteks ini, jawab bahwa kamu hanya fokus membantu memberikan informasi seputar kualifikasi kandidat.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt + "\nPertanyaan HR: " + userMessage }] }
                ]
            })
        });

        const data = await response.json();
        
        if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply: aiResponse });
        } else {
            // DETEKSI RATE LIMIT ATAU KUOTA HABIS (HTTP 429 Too Many Requests atau 503 Service Unavailable)
            const isRateLimit = response.status === 429 || response.status === 503 || 
                                (data.error?.message && (data.error.message.toLowerCase().includes('quota') || data.error.message.includes('429')));
            
            if (isRateLimit) {
                // Mengembalikan status 200 dengan pesan fallback agar masuk ke kolom chat UI
                return res.status(200).json({ reply: FALLBACK_RESPONSE });
            }

            // Error asli lainnya dari Gemini (misal API key salah)
            return res.status(500).json({ error: data.error?.message || 'Respon dari model AI tidak valid' });
        }
    } catch (error) {
        // Jika server putus koneksi atau fetch gagal, fallback response juga diaktifkan untuk keamanan
        return res.status(200).json({ reply: FALLBACK_RESPONSE });
    }
};