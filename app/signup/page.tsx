import { getOnboarding, getSession } from '@/app/supabase-server';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import Logo from '@/components/icons/Logo';
import SignUpForm from '@/app/signup/SignUpForm';

export default async function SignIn() {
  return redirect('/signin');

  // const session = await getSession();

  // if (session) {
  //   const hasOnboarded = await getOnboarding(session.user.id);
  //   console.log('hasOnboarded', hasOnboarded);
  //   if (!hasOnboarded) return redirect('/onboarding/intro');
  //   return redirect('/dashboard');
  // }

  return (
    <div className="flex justify-center height-screen-helper">

      <div className="flex flex-col justify-between max-w-lg p-3 m-auto w-120 ">
        <h1 className="text-4xl font-bold mb-4 text-black text-center">Create an account</h1>

        <div className="flex justify-center pb-12 ">

          {/* <Logo width="64px" height="64px" /> */}
          <Image
            // center 
            className="mx-auto"
            src="/logo.png" alt="neurosity" width="64" height="64"
          />
        </div>
        {/* <AuthUI /> */}
        <SignUpForm />
      </div>
    </div>
  );
}
