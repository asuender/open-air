import { Flex, Link as RadixLink, Heading } from "@radix-ui/themes";
import { NavLink } from "react-router";

const navItems = [
  { to: "/", label: "Overview", end: true },
  { to: "/requirements", label: "Requirements", end: false },
] as const;

export function Header() {
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
            {navItems.map(({ to, label, end }) => (
              <RadixLink key={to} asChild weight="medium" underline="none">
                <NavLink
                  to={to}
                  end={end}
                  style={({ isActive }) => ({
                    color: isActive ? "var(--accent-11)" : "var(--gray-11)",
                  })}
                >
                  {label}
                </NavLink>
              </RadixLink>
            ))}
          </nav>
        </Flex>
      </header>
    </Flex>
  );
}
