'use client';;
import * as React from 'react';
import { ShoppingBag, BarChart3, BookOpen, Info, LifeBuoy, Hammer, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Logo: use lucide-react instead of custom SVG
const Logo = (props) => <Hammer aria-hidden className="h-[1em] w-[1em]" {...props} />;

// Default navigation links (BidHub)
// Parents act as submenu labels; children are actual links.
const defaultNavigationLinks = [
  { href: '/featured_auctions', label: 'Browse Auctions', icon: 'ShoppingBag' },
  { href: '/categories', label: 'Categories', icon: 'BarChart3' },
  {
    label: 'About Us',
    submenu: true,
    type: 'simple',
    items: [
      { href: '/about', label: 'Overview' },
      { href: '/how_it_works', label: 'How It Works' },
      { href: '/contact', label: 'Contact Us' },
    ],
  },
];

const renderIcon = (iconName) => {
  switch (iconName) {
    case 'ShoppingBag':
      return <ShoppingBag size={16} className="text-white" aria-hidden={true} />;
    case 'BarChart3':
      return <BarChart3 size={16} className="text-white" aria-hidden={true} />;
    case 'LifeBuoy':
      return <LifeBuoy size={16} className="text-white" aria-hidden={true} />;
    case 'Info':
      return <Info size={16} className="text-white" aria-hidden={true} />;
    case 'BookOpen':
      return <BookOpen size={16} className="text-white" aria-hidden={true} />;
    default:
      return null;
  }
};

export const Navbar02 = React.forwardRef((
  {
    className,
    logo = <Logo />,
    logoHref = '#',
    brandText = 'BidHub',
    navigationLinks = defaultNavigationLinks,
    signInText = 'Sign In',
    signInHref = '#signin',
    ctaText = 'Get Started',
    ctaHref = null,
    secondaryCtaText = null,
    secondaryCtaHref = null,
    onSignInClick,
    onCtaClick,
    onSecondaryCtaClick,
    onLogoClick,
    ...props
  },
  ref
) => {
  // No JS breakpoint detection; rely on Tailwind responsive classes.

  return (
    <nav
      ref={ref}
      className={className}
      {...props}>
      <div
        className="container mx-auto max-w-7xl px-2 md:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {/* Mobile menu trigger (visible below md) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground sm:hidden"
                variant="ghost"
                size="icon">
                <Menu className='pointer-events-none h-4 w-4' />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2 bg-[var(--theme-primary)] text-white border border-[var(--theme-secondary)]">
              <NavigationMenu className="max-w-none">
                <NavigationMenuList className="flex-col items-start gap-0">
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index} className="w-full">
                      {link.submenu ? (
                        <>
                          <div className="px-3 py-1.5 text-xs font-medium text-white">
                            {link.label}
                          </div>
                          <ul>
                            {link.items?.map((item, itemIndex) => (
                              <li key={itemIndex}>
                                <a
                                  href={item.href ?? '#'}
                                  onClick={item.onClick}
                                  className="inline-flex w-full justify-start items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-white transition-colors no-underline bg-transparent hover:bg-[var(--theme-secondary)] focus-visible:ring-[color:var(--theme-secondary)]/40 focus:outline-none">
                                  {item.icon ? renderIcon(item.icon) : null}
                                  <span className="text-white">{item.label}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <a
                          href={link.href}
                          className="inline-flex w-full justify-start items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-white transition-colors no-underline bg-transparent hover:bg-[var(--theme-secondary)] focus-visible:ring-[color:var(--theme-secondary)]/40 focus:outline-none">
                          {link.icon ? renderIcon(link.icon) : null}
                          <span className="text-white">{link.label}</span>
                        </a>
                      )}
                      {/* Add separator between different types of items */}
                      {index < navigationLinks.length - 1 &&
                        ((!link.submenu && navigationLinks[index + 1].submenu) ||
                          (link.submenu && !navigationLinks[index + 1].submenu) ||
                          (link.submenu &&
                            navigationLinks[index + 1].submenu &&
                            link.type !== navigationLinks[index + 1].type)) && (
                          <div
                            role="separator"
                            aria-orientation="horizontal"
                            className="bg-border -mx-1 my-1 h-px w-full" />
                        )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>
          {/* Main nav */}
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (onLogoClick) return onLogoClick();
                try {
                  if (logoHref && typeof window !== 'undefined') window.location.assign(logoHref);
                } catch {}
              }}
              className="flex items-center space-x-2 text-white hover:opacity-90 transition-colors cursor-pointer">
              <div className="text-2xl">
                {logo}
              </div>
              <span className="font-bold text-xl sm:inline-block text-white">{brandText}</span>
            </button>
            {/* Navigation menu (visible sm and up) */}
            <NavigationMenu className="hidden sm:flex" viewport={false}>
              <NavigationMenuList className="gap-1">
                {navigationLinks.map((link, index) => (
                  <NavigationMenuItem key={index}>
                    {link.submenu ? (
                      <>
                        <NavigationMenuTrigger
                          className={cn(
                            navigationMenuTriggerStyle(),
                            'cursor-pointer bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-secondary)] transition-colors focus-visible:ring-[color:var(--theme-secondary)]/40 focus:outline-none text-white'
                          )}>
                          {renderIcon(link.icon)}{link.label}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="bg-[var(--theme-primary)] text-white border border-[var(--theme-secondary)]">
                          {link.type === 'description' ? (
                            <div
                              className="grid gap-2 p-3 w-[300px] md:w-[360px] lg:w-[420px] lg:grid-cols-1">
                              <div className="row-span-3">
                                <NavigationMenuLink asChild>
                                  <button
                                    onClick={(e) => e.preventDefault()}
                                    className="flex h-full w-full select-none flex-col justify-center items-center text-center rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md cursor-pointer">
                                    <div className="mb-3 text-xl font-medium">
                                      shadcn.io
                                    </div>
                                    <p className="text-sm leading-tight text-muted-foreground">
                                      Beautifully designed components built with Radix UI and Tailwind CSS.
                                    </p>
                                  </button>
                                </NavigationMenuLink>
                              </div>
                              {link.items?.map((item, itemIndex) => (
                                <ListItem key={itemIndex} title={item.label} href={item.href} onClick={item.onClick} type={link.type}>
                                  {item.description}
                                </ListItem>
                              ))}
                            </div>
                          ) : link.type === 'simple' ? (
                            <div
                              className="grid w-[260px] gap-1 p-2 md:w-[300px] grid-cols-1">
                              {link.items?.map((item, itemIndex) => (
                                <ListItem key={itemIndex} title={item.label} href={item.href} onClick={item.onClick} type={link.type}>
                                  {item.description}
                                </ListItem>
                              ))}
                            </div>
                          ) : link.type === 'icon' ? (
                            <div className="grid w-[280px] gap-2 p-3 grid-cols-1">
                              {link.items?.map((item, itemIndex) => (
                                <ListItem
                                  key={itemIndex}
                                  title={item.label}
                                  href={item.href}
                                  onClick={item.onClick}
                                  icon={item.icon}
                                  type={link.type}>
                                  {item.description}
                                </ListItem>
                              ))}
                            </div>
                          ) : (
                            <div className="grid gap-2 p-3 w-[260px] md:w-[300px] grid-cols-1">
                              {link.items?.map((item, itemIndex) => (
                                <ListItem key={itemIndex} title={item.label} href={item.href} onClick={item.onClick} type={link.type}>
                                  {item.description}
                                </ListItem>
                              ))}
                            </div>
                          )}
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink asChild>
                        <a
                          href={link.href}
                          className={cn(
                            navigationMenuTriggerStyle(),
                            'cursor-pointer bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-secondary)] transition-colors no-underline focus:outline-none text-white inline-flex items-center gap-2'
                          )}>
                          {link.icon ? renderIcon(link.icon) : null}
                          <span className="text-white">{link.label}</span>
                        </a>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        {/* Right side */}
        <div className="flex items-center gap-3">

          <Button
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-white hover:bg-[var(--nav-hover-bg)] hover:text-white"
            loadingOnClick
            onClick={(e) => {
              e.preventDefault();
              if (onSignInClick) onSignInClick();
            }}>
            {signInText}
          </Button>
          {ctaHref ? (
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 disabled:brightness-95 disabled:saturate-75 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-secondary)] focus-visible:ring-[color:var(--theme-secondary)]/40 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
              <span className="text-white">{ctaText}</span>
            </a>
          ) : (
            <Button
              size="sm"
              variant="brand"
              loadingOnClick
              onClick={(e) => {
                e.preventDefault();
                if (onCtaClick) onCtaClick();
              }}>
              {ctaText}
            </Button>
          )}

          {secondaryCtaText && (
            secondaryCtaHref ? (
              <a
                href={secondaryCtaHref}
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 disabled:brightness-95 disabled:saturate-75 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-secondary)] focus-visible:ring-[color:var(--theme-secondary)]/40 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
                <span className="text-white">{secondaryCtaText}</span>
              </a>
            ) : (
              <Button
                size="sm"
                variant="brand"
                loadingOnClick
                onClick={(e) => {
                  e.preventDefault();
                  if (onSecondaryCtaClick) onSecondaryCtaClick();
                }}>
                {secondaryCtaText}
              </Button>
            )
          )}
        </div>
      </div>
    </nav>
  );
});

Navbar02.displayName = 'Navbar02';

// ListItem component for navigation menu items
const ListItem = React.forwardRef(({ className, title, children, icon, type, href = '#', onClick, ...props }, ref) => {
  return (
    <NavigationMenuLink asChild>
      <a
        ref={ref}
        href={href}
        onClick={onClick}
        className={cn(
          'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors text-white hover:bg-[var(--theme-secondary)] hover:text-white focus:bg-[var(--theme-secondary)] focus:text-white cursor-pointer',
          className
        )}
        {...props}>
        {type === 'icon' && icon ? (
          <div className="flex items-start space-x-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-surface)]">
              {renderIcon(icon)}
            </div>
            <div className="space-y-1">
              <div className="text-base font-medium leading-tight text-white">{title}</div>
              {children && (
                <p className="line-clamp-2 text-sm leading-snug text-white">
                  {children}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-base font-medium leading-none text-white">{title}</div>
            {children && (
              <p className="line-clamp-2 text-sm leading-snug text-white">
                {children}
              </p>
            )}
          </>
        )}
      </a>
    </NavigationMenuLink>
  );
});
ListItem.displayName = 'ListItem';

export { Logo };
