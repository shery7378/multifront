import { redirect } from 'next/navigation';

// Redirect the root URL (/) to /home
// This ensures multikonnect.com always shows the home page
export default function RootPage() {
  redirect('/home');
}
