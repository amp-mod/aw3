<script>
  import SiScratch from '~icons/simple-icons/scratch';
  import SiCodeberg from '~icons/simple-icons/codeberg';
  import SiMiraheze from '~icons/simple-icons/miraheze';
  import SiYoutube from '~icons/simple-icons/youtube';
</script>

<footer
  class="dark:black/10 flex flex-col items-center justify-center space-y-2 border-t border-black/10 py-8 text-neutral-500 dark:border-white/10 dark:text-neutral-300"
>
  <div class="flex items-center justify-center space-x-6">
    <!-- <a
      href="https://scratch.mit.edu/discuss/topic/806311/"
      class="hover:text-[#855CD6] focus:ring-2 focus:ring-[#855CD6] focus:ring-offset-2 focus:outline-none"
      ><SiScratch size={32} title="Scratch" /></a
    > *-->
    <a
      href="https://codeberg.org/ampmod"
      class="text-2xl hover:text-[#2185D0] focus:ring-2 focus:ring-[#2185D0] focus:ring-offset-2 focus:outline-none"
      ><SiCodeberg size={32} title="Codeberg" /></a
    >
    <a
      href="https://ampmod.miraheze.org"
      class="text-2xl hover:text-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
      ><SiMiraheze size={32} title="Wiki (Miraheze)" /></a
    >
    <a
      href="https://youtube.com/@Amp-Mod"
      class="text-2xl hover:text-[#FF0033] focus:ring-2 focus:ring-[#FF0033] focus:ring-offset-2 focus:outline-none"
      ><SiYoutube size={32} title="YouTube" /></a
    >
  </div>

  <div class="mt-2 flex space-x-4 text-sm">
    <a href="/credits" class="underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >Credits</a
    >
    <a href="/faq" class="underline focus:ring-2 focus:ring-offset-2 focus:outline-none">FAQ</a>
    <a href="/tips" class="underline focus:ring-2 focus:ring-offset-2 focus:outline-none">Tips</a>
    <a href="/terms" class="underline focus:ring-2 focus:ring-offset-2 focus:outline-none">Terms</a>
    <a href="/privacy" class="underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >Privacy</a
    >
    <a href="/source-code" class="underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >Source code</a
    >
  </div>

  <span class="mt-2 text-center text-sm">Not affiliated with Scratch or TurboWarp.</span>
</footer>
