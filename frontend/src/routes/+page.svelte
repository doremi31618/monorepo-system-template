
<script lang="ts">
      import { AppConfig } from "$lib/config";
      import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
      import { Separator } from "$lib/components/ui/separator/index.js";

</script>

<header class="container mx-auto py-4 flex items-center justify-between">
    <div>logo</div>
    <NavigationMenu.Root>
        <NavigationMenu.List class="flex items-center justify-between bg-amber-100  max-w-4xl">
            
            <div class="flex items-center justify-between">
                <NavigationMenu.Item>
                    <NavigationMenu.Link href={AppConfig.route.base}>Home</NavigationMenu.Link>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <NavigationMenu.Link href={AppConfig.route.auth.login}>login</NavigationMenu.Link>
                </NavigationMenu.Item>
                <NavigationMenu.Item>
                    <NavigationMenu.Link href={AppConfig.route.auth.register}>signup</NavigationMenu.Link>
                </NavigationMenu.Item>
            </div>
            
        </NavigationMenu.List>
    </NavigationMenu.Root>
</header>

<section class="container mx-auto my-16">
    <h1 class="text-4xl font-bold">Welcome to the website</h1>
    <p class="text-lg text-gray-600">This is a website about the website</p>
</section>

<section class="container mx-auto grid grid-cols-3 gap-4 my-16">
    <div class="bg-amber-100 p-4 rounded-lg">
        <h2 class="text-2xl font-bold">Feature 1</h2>
        <p class="text-gray-600">This is a feature of the website</p>
    </div>
    <div class="bg-amber-100 p-4 rounded-lg">
        <h2 class="text-2xl font-bold">Feature 2</h2>
        <p class="text-gray-600">This is a feature of the website</p>
    </div>
    <div class="bg-amber-100 p-4 rounded-lg">
        <h2 class="text-2xl font-bold">Feature 3</h2>
        <p class="text-gray-600">This is a feature of the website</p>
    </div>
</section>

<div class="container mx-auto">
    <Separator />
</div>
