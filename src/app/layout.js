import './globals.css';

export const metadata = {
  title: 'SmartIoT - Intelligent Device Management',
  description: 'Manage and monitor your IoT devices',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
