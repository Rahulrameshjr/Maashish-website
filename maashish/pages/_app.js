import '../styles/globals.css';
import Navbar from '../components/Navbar';

export default function App({ Component, pageProps }) {
  return (
    <>
      <div className="grain" />
      <Navbar />
      <div className="pt-14">
        <Component {...pageProps} />
      </div>
    </>
  );
}
