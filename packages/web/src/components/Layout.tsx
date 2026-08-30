import type { ComponentChildren } from "preact";

import { Box, Container } from "@radix-ui/themes";

import { Header } from "./Header.tsx";

interface LayoutProps {
  children: ComponentChildren;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Box style={{ minHeight: "100svh" }}>
      <Header />
      <Container size="4" px="5" py="6" asChild>
        <main>{children}</main>
      </Container>
    </Box>
  );
}
