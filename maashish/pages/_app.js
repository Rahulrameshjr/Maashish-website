// pages/_app.js
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import AuthGuard from '../components/AuthGuard';
import { useRouter } from 'next/router';

// Pages that don't need login
const PUBLIC_PAGES = ['/login'];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isPublic = PUBLIC_PAGES.includes(router.pathname);

  if (isPublic) {
    return (
      <>
        <div className="grain" />
        <Component {...pageProps} />
      </>
    );
  }

  return (
    <>
      <div className="grain" />
      <AuthGuard>
        <Navbar />
        <div className="pt-14">
          <Component {...pageProps} />
        </div>
      </AuthGuard>
    </>
  );
}