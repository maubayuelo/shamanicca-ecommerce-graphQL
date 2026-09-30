import type { GetServerSideProps } from 'next';

export default function NewsletterConfirmedPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/newsletter?confirmed=1',
    permanent: false,
  },
});
