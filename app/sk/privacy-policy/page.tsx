import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ochrana osobných údajov | PETIT.SOT STUDIO",
  description: "Informácie o spracúvaní osobných údajov pri návšteve webovej stránky PETIT.SOT STUDIO a pri kontaktovaní autorky.",
  alternates: { canonical: "https://www.petitsot.com/sk/privacy-policy" },
  robots: { index: true, follow: true },
};

export default function SlovakPrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-neutral-900" lang="sk">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">PETIT.SOT STUDIO</p>
      <h1 className="mb-4 text-4xl tracking-tight">Ochrana osobných údajov</h1>
      <p className="mb-10 text-sm text-neutral-500">Aktualizované: 13. novembra 2026</p>
      <div className="space-y-8 leading-7">
        <section>
          <h2 className="mb-2 text-xl">1. Kto zodpovedá za spracúvanie údajov?</h2>
          <p>Prevádzkovateľom osobných údajov na stránke petitsot.com je Serhii Kapuza, ktorý prevádzkuje projekt PETIT.SOT STUDIO prezentujúci tvorbu výtvarníčky Olgy Trikhleb. Kontakt: <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>. Korešpondenčná adresa: Kuzmanyho 725/15, 911 01 Trenčín, Slovensko.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">2. Aké údaje spracúvame a prečo?</h2>
          <p>Ak nás kontaktujete prostredníctvom formulára, spracúvame vaše meno, e-mailovú adresu a správu, aby sme mohli odpovedať na vašu otázku. Správa sa odosiela do nakonfigurovaného chatu alebo chatov v službe Telegram a môže tam zostať uložená až do jej vymazania. Do správy, prosím, nevkladajte citlivé údaje, ak to nie je nevyhnutné.</p>
          <p className="mt-2">Pri prehliadaní stránky môžu poskytovatelia hostingu a infraštruktúry spracúvať technické údaje, napríklad IP adresu, informácie o prehliadači, navštívené stránky a obrázky či bezpečnostné záznamy, aby mohli web doručovať a chrániť. Ak administrátor použije integráciu Pinterestu, môžu sa spracúvať autorizačné údaje účtu a záznamy o publikovaní obrázkov.</p>
          <p className="mt-2">Ak odošlete žiadosť o obraz na objednávku, spracúvame vaše meno, e-mail, prípadne krajinu, opis obrazu, preferovaný štýl a farby, požadované rozmery, zvolenú náročnosť, vygenerovaný návrh, cenovú ponuku a históriu objednávky. Údaje používame na prípravu odhadu, posúdenie a správu objednávky, komunikáciu, prijatie platby a doručenie diela. Do opisu obrazu, prosím, nevkladajte citlivé osobné údaje.</p>
          <p className="mt-2">Na vytvorenie voliteľného vizuálneho návrhu sa opis obrazu a vybrané vizuálne preferencie odošlú poskytovateľovi externej služby generovania obrázkov pomocou umelej inteligencie. Vygenerovaný návrh sa uloží k záznamu objednávky. Ide o koncept na diskusiu, nie o fotografiu hotového obrazu ani o záruku úplne totožného výsledku.</p>
          <p className="mt-2">Platby záloh a doplatkov spracúva PayPal. Dostávame informáciu o stave platby a referenčné čísla transakcií, údaje o platobnej karte však spracúva PayPal a neukladáme ich v databáze objednávok. Na informovanie štúdia a zasielanie aktualizácií môžeme používať nakonfigurované e-mailové a telegramové služby.</p>
          <p className="mt-2">Údaje používame na prevádzku a zabezpečenie stránky, odpovedanie na správy, vybavovanie licenčných otázok a objednávok a správu publikačných nástrojov. Právnym základom je podľa okolností vykonanie opatrení pred uzavretím zmluvy na vašu žiadosť, plnenie zmluvy, oprávnený záujem na prevádzke a ochrane portfólia alebo plnenie zákonnej povinnosti podľa GDPR.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">3. Súbory cookie a externé služby</h2>
          <p>Stránka používa vlastný súbor cookie <code>NEXT_LOCALE</code>, ktorý si pamätá, či uprednostňujete angličtinu, ruštinu alebo slovenčinu. Môžu sa používať aj funkčné autentifikačné súbory cookie potrebné na autorizovanú správu stránky. Zámerne nepoužívame reklamné súbory cookie ani analytické pixely. Ak otvoríte odkaz na Etsy, Instagram, Pinterest alebo inú externú službu, uplatňuje sa jej vlastné vyhlásenie o ochrane súkromia.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">4. Komu môžu byť údaje sprístupnené?</h2>
          <p>Údaje poskytujeme iba v rozsahu potrebnom na prevádzku stránky a jej funkcií. Medzi poskytovateľov patria Vercel (hosting) a Supabase (databáza a úložisko obrázkov). Správy z formulára sa doručujú prostredníctvom služieb Telegram a Resend. Poskytovateľ AI spracúva text a vizuálne preferencie potrebné na vytvorenie požadovaného návrhu. Platby za objednávky spracúva PayPal. Pinterest môže spracúvať údaje pri použití publikačnej integrácie administrátorom. Obrázky diel sú verejne dostupné na stránke a prehliadač návštevníka ich môže načítavať priamo od poskytovateľa úložiska. V závislosti od infraštruktúry a nastavení poskytovateľov môže dochádzať k spracúvaniu údajov mimo Európskeho hospodárskeho priestoru. Osobné údaje nepredávame.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">5. Ako dlho údaje uchovávame?</h2>
          <p>Správy uchovávame počas primeraného času potrebného na odpoveď a následnú komunikáciu; dlhšie iba vtedy, ak je to potrebné na splnenie zákonnej povinnosti alebo uplatnenie právnych nárokov. Kópie doručené do Telegramu môžu zostať v histórii chatu až do vymazania správcom a môžu podliehať aj vlastným systémom Telegramu. Technické záznamy a publikačné údaje uchovávame podľa nastavení príslušnej služby na účely prevádzky, bezpečnosti a riešenia problémov. Údaje o objednávkach a vygenerované návrhy uchovávame počas vybavovania a dokumentovania objednávky a dlhšie, ak to vyžaduje účtovníctvo, zákon alebo ochrana právnych nárokov. Zverejnené obrázky diel a záznamy o certifikátoch pravosti zostávajú dostupné, kým ich portfólio a overovacia služba potrebujú.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">6. Vaše práva</h2>
          <p>V súlade s platnými právnymi predpismi môžete požiadať o prístup k svojim osobným údajom, ich opravu, vymazanie alebo obmedzenie spracúvania, namietať proti spracúvaniu založenému na oprávnenom záujme a za splnenia zákonných podmienok požiadať o prenos údajov. Žiadosť pošlite na <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>. Sťažnosť môžete podať aj na Úrade na ochranu osobných údajov Slovenskej republiky na stránke <a className="underline underline-offset-4" href="https://dataprotection.gov.sk/" target="_blank" rel="noreferrer">dataprotection.gov.sk</a>.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">7. Aktualizácie a kontakt</h2>
          <p>Toto vyhlásenie môžeme aktualizovať pri zmenách webovej stránky alebo používaných služieb. Aktuálna verzia a dátum aktualizácie budú zverejnené na tejto stránke. V prípade otázok o ochrane súkromia nás kontaktujte na <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.</p>
        </section>
      </div>
    </main>
  );
}
