import { Flex, Link as RadixLink, Heading } from "@radix-ui/themes";
import { useLocation } from "preact-iso";

const navItems = [
  { href: "/", label: "Overview", end: true },
  { href: "/requirements", label: "Requirements", end: false },
] as const;

export function Header() {
  const { path } = useLocation();

  return (
    <Flex
      asChild
      align="center"
      px="5"
      py="3"
      gap="4"
      style={{ borderBottom: "1px solid var(--gray-a5)" }}
    >
      <header>
        <Heading size="4" as="h1">
          open-air
        </Heading>
        <Flex asChild gap="4" align="center">
          <nav>
            {navItems.map(({ href, label, end }) => {
              const isActive = end ? path === href : path.startsWith(href);

              return (
                <RadixLink key={href} asChild weight="medium" underline="none">
                  <a
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      color: isActive ? "var(--accent-11)" : "var(--gray-11)",
                    }}
                  >
                    {label}
                  </a>
                </RadixLink>
              );
            })}
          </nav>
        </Flex>
      </header>
    </Flex>
  );
}
