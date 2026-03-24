import { redirect } from 'next/navigation';

export default function NewRedirectPage() {
  redirect('/create/manual');
}
