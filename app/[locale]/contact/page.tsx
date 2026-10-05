import ContactForm from "./ContactForm";

export default async function Contact({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  const ru=locale==="ru";
  return (
    <main className="contact-page contact-form-page">
      <div className="contact-inner">
        <span className="contact-eyebrow">{ru?"СВЯЗАТЬСЯ":"GET IN TOUCH"}</span>
        <h1>{ru?<>Давайте поговорим<br/><em>об искусстве.</em></>:<>Let’s talk<br/><em>about art.</em></>}</h1>
        <p>{ru?"По вопросам о картинах, покупке или сотрудничестве оставьте сообщение.":"For artwork enquiries, purchases or collaborations, leave us a message."}</p>
        <ContactForm ru={ru}/>
      </div>
    </main>
  );
}
