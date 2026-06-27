/**
 * Мини-тест: загружается ли картинка в браузере.
 * http://localhost:3000/test-img
 */

export default function TestImg() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-void p-8">
      <h1 className="font-display text-2xl text-moon">Тест картинок</h1>
      <div className="flex flex-wrap gap-6">
        <div className="text-center">
          <p className="mb-2 text-sm text-moon/60">back.gif (рубашка)</p>
          <img
            src="/deck/back.gif"
            alt="Рубашка"
            className="w-36 rounded-xl border border-gold/40 shadow-card"
          />
        </div>
        <div className="text-center">
          <p className="mb-2 text-sm text-moon/60">39.gif (Четвёрка кубков)</p>
          <img
            src="/deck/39.gif"
            alt="Четвёрка кубков"
            className="w-36 rounded-xl border border-gold/40 shadow-card"
          />
        </div>
        <div className="text-center">
          <p className="mb-2 text-sm text-moon/60">14.gif (Умеренность)</p>
          <img
            src="/deck/14.gif"
            alt="Умеренность"
            className="w-36 rounded-xl border border-gold/40 shadow-card"
          />
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-moon/60">Видишь эти картинки?</p>
        <div className="mt-4 flex justify-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/deck/0.gif" alt="0" className="h-20 w-14 object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/deck/1.gif" alt="1" className="h-20 w-14 object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/deck/10.gif" alt="10" className="h-20 w-14 object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/deck/50.gif" alt="50" className="h-20 w-14 object-cover" />
        </div>
      </div>
    </main>
  );
}
