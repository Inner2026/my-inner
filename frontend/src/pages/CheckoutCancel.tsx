import { Link } from 'react-router-dom';

export function CheckoutCancel() {
  return <div className="checkout-page min-h-[calc(100vh-74px)] px-4 py-16"><div className="mx-auto max-w-md rounded-3xl border border-[#eee5e9] bg-white p-10 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff3e5] text-2xl text-[#b47a35]">!</div><h1 className="mt-5 text-2xl font-semibold text-[#302447]">Payment cancelled</h1><p className="mt-3 text-sm leading-6 text-slate-500">No payment was completed. You can return to the tests and try again whenever you are ready.</p><Link to="/tests" className="mt-6 inline-flex rounded-full bg-[#765c8d] px-5 py-3 text-sm font-semibold text-white">Back to tests</Link></div></div>;
}
