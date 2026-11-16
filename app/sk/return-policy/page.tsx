import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vrátenie tovaru a peňazí | PETIT.SOT STUDIO",
  description: "Informácie o vrátení a refundácii originálnych obrazov Olgy Trikhleb zakúpených cez PETIT.SOT STUDIO a partnerské trhoviská.",
  alternates: { canonical: "https://www.petitsot.com/sk/return-policy" },
  robots: { index: true, follow: true },
};

export default function SlovakReturnPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-neutral-900" lang="sk">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">PETIT.SOT STUDIO</p>
      <h1 className="mb-4 text-4xl tracking-tight">Vrátenie tovaru a peňazí</h1>
      <p className="mb-10 text-sm text-neutral-500">Aktualizované: 13. novembra 2026</p>
      <div className="space-y-8 leading-7">
        <section>
          <h2 className="mb-2 text-xl">1. Kde sa nákup uskutočňuje</h2>
          <p>Web petitsot.com je umelecké portfólio a zároveň prijíma priame objednávky obrazov na mieru. Nákup hotových diel uvedených v ponuke môže prebiehať prostredníctvom trhoviska, napríklad Etsy alebo Sashe. Žiadosť o vrátenie takéhoto nákupu treba začať na tom istom trhovisku a v účte, ktorý bol použitý pri objednávke. Objednávky obrazov na mieru, ktoré boli vyžiadané a prijaté cez túto stránku, sa uzatvárajú priamo s PETIT.SOT STUDIO a platia sa bezpečne cez PayPal. Na tieto objednávky sa vzťahujú samostatné podmienky objednávky obrazu.</p>
          <p className="mt-2">Postupy trhoviska platia popri povinných právach spotrebiteľa, ktoré nemožno zo zákona vylúčiť. Ak sa toto vyhlásenie líši od kogentných právnych predpisov, prednosť majú zákonné práva spotrebiteľa.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">2. Odstúpenie od zmluvy bez uvedenia dôvodu</h2>
          <p>Ak vám zákon priznáva právo odstúpiť od zmluvy uzavretej na diaľku, spotrebitelia v Európskej únii majú spravidla 14 dní odo dňa prevzatia obrazu na oznámenie predávajúcemu, že chcú od zmluvy odstúpiť, pokiaľ sa neuplatňuje zákonná výnimka. Po oznámení odstúpenia je spravidla potrebné odoslať obraz späť v ďalšej lehote 14 dní. Pred odoslaním si vyžiadajte pokyny na vrátenie prostredníctvom správ v trhovisku alebo kontaktovaním predávajúceho v rámci objednávky.</p>
          <p className="mt-2">Kupujúci znáša priame náklady na vrátenie tovaru, ak bol o tejto povinnosti informovaný pred nákupom a vrátenie nie je spôsobené našou chybou. Obraz bezpečne zabaľte, aby sa počas prepravy nepoškodil. S obrazom môžete zaobchádzať v rozsahu primerane potrebnom na zistenie jeho povahy a vlastností; za zníženie hodnoty spôsobené zaobchádzaním nad tento rozsah môžete zodpovedať podľa zákona.</p>
          <p className="mt-2">Zákonné právo na odstúpenie sa nemusí vzťahovať na niektoré objednávky, pri ktorých platí zákonná výnimka, napríklad na obraz vytvorený podľa osobitných požiadaviek zákazníka alebo jasne personalizovaný pre konkrétnu osobu. Výnimku uplatníme iba v rozsahu povolenom príslušnými právnymi predpismi.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">3. Poškodený, nesprávny alebo nedoručený tovar</h2>
          <p>Ak obraz príde poškodený, dostanete iný výrobok alebo vám objednávka nebude doručená, kontaktujte predávajúceho prostredníctvom trhoviska hneď, ako je to primerane možné. Uveďte číslo objednávky a podľa okolností priložte jasné fotografie obalu a obrazu. Situáciu preveríme a v spolupráci s trhoviskom zabezpečíme nápravu požadovanú príslušnými právnymi predpismi a postupmi trhoviska. Vaše zákonné práva nie sú obmedzené touto žiadosťou o doplňujúce informácie.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">4. Vrátenie peňazí</h2>
          <p>Pri nákupoch cez trhovisko sa schválená refundácia spracúva prostredníctvom pôvodného trhoviska a podľa možností rovnakým spôsobom platby. Pri priamych objednávkach obrazov na mieru sa prípadná refundácia uskutoční podľa možností prostredníctvom pôvodnej platby PayPal, v súlade s dohodnutými podmienkami objednávky a kogentnými právnymi predpismi na ochranu spotrebiteľa. Ak sa uplatňuje zákonné odstúpenie od zmluvy, predávajúci spravidla vráti platbu do 14 dní od oznámenia odstúpenia; môže ju však zadržať, kým nedostane obraz späť alebo kým kupujúci nepreukáže jeho odoslanie, podľa toho, čo nastane skôr. Refundácia zahŕňa štandardné náklady na pôvodné doručenie, ak to vyžaduje zákon, nie však dodatočné náklady na drahší spôsob doručenia zvolený kupujúcim.</p>
          <p className="mt-2">Pri vrátení z dôvodu vady, poškodenia alebo nesprávne dodaného tovaru sa náklady na vrátenie a spôsob nápravy riešia podľa príslušných právnych predpisov na ochranu spotrebiteľa a postupu trhoviska.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">5. Kontakt</h2>
          <p>Ak potrebujete pomoc s vrátením tovaru, kontaktujte predávajúceho prostredníctvom trhoviska, na ktorom ste objednávku uskutočnili, alebo napíšte na <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>. Uveďte názov trhoviska a referenčné číslo objednávky. Neposielajte údaje o platobnej karte.</p>
        </section>
      </div>
    </main>
  );
}
