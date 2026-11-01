module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userMessage } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY belum terkonfigurasi di Vercel' });
    }

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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt + "\nPertanyaan HR: " + userMessage }] }
                ]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply: aiResponse });
        } else {
            return res.status(500).json({ error: 'Respon dari model AI tidak valid' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Gagal terhubung ke server AI' });
    }
};