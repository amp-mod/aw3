<!-- TODO: Add stuff for the website.  Copied from extension library because the one from ampmod-web-front somehow won't work. -->
<script lang="ts">
    import Logo from './logo.svg';
</script>

<header class="fixed top-0 left-0 w-full h-[50px] flex items-center bg-accent text-white font-sans text-sm border-b border-black/20 shadow-md px-2 md:px-4 z-10">
    <div class="flex items-center w-full gap-4">

        <a href="/" class="flex items-center logo-link">
            <img src={Logo} draggable=false height=28 alt="AmpMod" class="h-[28px] transition-transform duration-100 hover:scale-105" />
        </a>

        <div class="hidden md:flex items-center gap-2">
            <a href="https://ampmod.codeberg.page/editor.html" class="font-bold px-3 py-2 rounded cursor-pointer whitespace-nowrap header-link hover:bg-black/10">Create</a>
            <a href="https://ampmod.codeberg.page/credits.html" class="font-bold px-3 py-2 rounded cursor-pointer whitespace-nowrap header-link hover:bg-black/10">Credits</a>
            <a href="https://ampmod.flarum.cloud" class="font-bold px-3 py-2 rounded cursor-pointer whitespace-nowrap header-link hover:bg-black/10">Discuss</a>
            <a href="https://codeberg.org/AmpMod" class="font-bold px-3 py-2 rounded cursor-pointer whitespace-nowrap header-link hover:bg-black/10">Contribute</a>
        </div>

    </div>
</header>
<div class="w-full mt-[50px]"></div> 