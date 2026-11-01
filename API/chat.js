export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userMessage } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Disimpan aman di Vercel

    // Konteks CV kamu agar AI menjawab sesuai data dirimu saja
    const systemPrompt = `
    Kamu adalah Asisten AI untuk portofolio kandidat S1 Teknik Informatika.
    Data Kandidat:
    - Fokus: Data Engineering, AI, Data Analytics.
    - Skripsi: Deteksi Kerusakan CVT Motor Matic menggunakan Audio Spectrogram Transformer (AST) pada PyTorch.
    - Proyek DBS: FloodSight (Prediksi Banjir CNN Hybrid dengan citra satelit Google Earth Engine + data tabular, Nilai: 87.8).
    - Kompetisi: Gold Medal NICYMS (Riset Komputasional Pola Kata Al-Qur'an).
    - Pengalaman Kerja: Live Streamer & Sales Makanan (komunikasi publik, pemahaman algoritma platform, target sales).
    - Lokasi & Minat: Siap magang di wilayah Bandung, Bekasi, Karawang, Jakarta (termasuk otomotif/Toyota).

    Tugasmu: Jawab pertanyaan HR dengan ramah, profesional, ringkas (maksimal 3-4 kalimat), dan jujur berdasarkan data di atas. Jika ditanya hal di luar konteks ini, jawab bahwa kamu hanya fokus membantu memberikan informasi seputar kualifikasi kandidat.
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
        const aiResponse = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ reply: aiResponse });
    } catch (error) {
        return res.status(500).json({ error: 'Gagal terhubung ke AI' });
    }
}