
import "./globals.css";
import RequestNotification from '../components/RequestNotification';



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <RequestNotification />
      </body>
    </html>
  );
}
