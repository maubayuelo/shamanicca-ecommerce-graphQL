import Image from 'next/image';
import Link from 'next/link';
import NewsletterForm from '../molecules/NewsletterForm';

export default function Footer() {
  return (
    <footer className="border-t border-gray-300">
      <div className="main py-7.5 sm:py-15">
        <div className="grid grid-cols-[1fr] gap-7.5 sm:grid-cols-[repeat(2,1fr)] lg:grid-cols-[34%_24%_15%_15%] xl:grid-cols-[30%_30%_15%_15%] xl:gap-legacy-45">
          <div className="flex flex-col">
            <h3 className="type-md type-extrabold type-uppercase m-0">Get The Good Stuff</h3>
            <p className="type-md">
              We're not into spam. Just: product drops and juicy updates.
              Hit subscribe and save – your inbox will thank you.
            </p>

            <NewsletterForm className="mt-15" />

            <div className="mt-xl-responsive mb-lg-responsive">
              <div className="type-sm mb-sm-responsive">Catch updates following us on:</div>
              <div className="flex gap-7.5">
                <a className="size-legacy-45 rounded-md bg-white [&_img]:w-full [&_img]:h-full [&_img]:object-contain" href="https://instagram.com/shamaniccatv" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <Image src="/images/icon-social-ig.svg" alt="Instagram" width={30} height={30} />
                </a>
                <a className="size-legacy-45 rounded-md bg-white [&_img]:w-full [&_img]:h-full [&_img]:object-contain" href="https://www.youtube.com/@shamanicca" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                  <Image src="/images/icon-social-yt.svg" alt="YouTube" width={30} height={30} />
                </a>
                <a className="size-legacy-45 rounded-md bg-white [&_img]:w-full [&_img]:h-full [&_img]:object-contain" href="https://www.tiktok.com/@shamaniccatv" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                  <Image src="/images/icon-social-tt.svg" alt="TikTok" width={30} height={30} />
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h4 className="type-md type-extrabold type-uppercase m-0">About</h4>
            <p className="type-md">
              All of our apparel is responsibly sourced and ethically manufactured. Each item is printed just for you, and ships within 7 days. We make t-shirts, they make statements.
            </p>
          </div>

          <div className="flex flex-col">
            <h4 className="type-md type-extrabold type-uppercase m-0">Explore</h4>
            <ul className="mt-md-responsive list-none p-0 flex flex-col gap-1.5">
              <li className="type-md"><Link href="/about">About Us</Link></li>
              <li className="type-md"><Link href="/returns-exchanges">Returns &amp; Exchanges</Link></li>
              <li className="type-md"><Link href="/size-chart">Size Chart</Link></li>
<li className="type-md"><Link href="/search">Search</Link></li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h4 className="type-md type-extrabold type-uppercase m-0">Customer Service</h4>
            <ul className="mt-md-responsive list-none p-0 flex flex-col gap-1.5">

              <li className="type-md"><Link href="/faq">FAQ</Link></li>
              <li className="type-md"><Link href="/contact">Contact Us</Link></li>
              <li className="type-md"><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li className="type-md"><Link href="/terms-and-conditions">Terms &amp; Conditions</Link></li>
            </ul>
            <div className="mt-lg-responsive type-md">©{new Date().getFullYear()} Shamanicca</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
