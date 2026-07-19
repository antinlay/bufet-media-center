import { Redirect, type Href } from 'expo-router';

export default function ContentsRedirect() {
  return <Redirect href={'/media' as Href} />;
}
