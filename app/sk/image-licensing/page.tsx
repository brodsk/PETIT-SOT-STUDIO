import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Licencia k obrázkom a autorské práva | PETIT.SOT STUDIO",
  description: "Informácie o autorských právach a používaní obrazov a fotografií zverejnených Olgou Trikhleb a PETIT.SOT STUDIO.",
  alternates: { canonical: "https://www.petitsot.com/sk/image-licensing" },
  robots: { index: true, follow: true },
};

export default function SlovakImageLicensingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-neutral-900" lang="sk">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">PETIT.SOT STUDIO</p>
      <h1 className="mb-4 text-4xl tracking-tight">Licencia k obrázkom a autorské práva</h1>
      <p className="mb-10 text-sm text-neutral-500">Aktualizované: 19. októbra 2026</p>
      <div className="space-y-8 leading-7">
        <section>
          <h2 className="mb-2 text-xl">Autorské práva</h2>
          <p>Obrazy prezentované na stránke petitsot.com sú pripísané výtvarníčke Olge Trikhleb, pokiaľ nie je uvedené inak. Obrazy, fotografie a texty webovej stránky môžu byť chránené autorským právom a ich nositelia práv sa môžu líšiť. PETIT.SOT STUDIO si nenárokuje vlastníctvo materiálov tretích strán.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">Kúpa originálneho obrazu</h2>
          <p>Kúpou fyzického obrazu sa automaticky neprevádzajú autorské práva ani nevzniká oprávnenie obraz rozmnožovať, zverejňovať alebo komerčne používať jeho reprodukciu. Akákoľvek samostatná licencia alebo prevod práv musí byť dohodnutý s príslušným nositeľom práv.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">Používanie a zdieľanie obrázkov</h2>
          <p>Môžete zdieľať odkaz na verejnú stránku tohto webu. Opätovné nahrávanie, rozmnožovanie alebo komerčné používanie obrázka umeleckého diela spravidla vyžaduje povolenie, pokiaľ príslušné právne predpisy neustanovujú inak. Toto vyhlásenie neobmedzuje zákonné výnimky ani práva priznané zákonom.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">Žiadosť o povolenie a podnet týkajúci sa autorských práv</h2>
          <p>V prípade žiadosti o licenciu alebo oznámenia podozrenia na porušenie práv či nesprávne uvedenie autora napíšte na <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>. Uveďte názov diela alebo URL stránky, zamýšľaný spôsob použitia alebo opis problému a svoje kontaktné údaje. Povolenie sa považuje za udelené až po potvrdení príslušným nositeľom práv.</p>
        </section>
      </div>
    </main>
  );
}
