import CommissionApproval from "./CommissionApproval";
export const dynamic="force-dynamic";
export const metadata={title:"Review your painting proposal | PETIT.SOT STUDIO",robots:{index:false,follow:false}};
export default async function CommissionApprovalPage({searchParams,params}:{searchParams:Promise<{ref?:string;token?:string}>;params:Promise<{locale:string}>}){const p=await searchParams;const {locale}=await params;return <CommissionApproval reference={String(p.ref||"")} token={String(p.token||"")} ru={locale==="ru"}/>;}
