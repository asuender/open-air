import { Box, Container } from "@radix-ui/themes";
import { Outlet } from "react-router";
import { Header } from "./Header.tsx";

export function Layout() {
  return (
    <Box style={{ minHeight: "100svh" }}>
      <Header />
      <Container size="4" px="5" py="6" asChild>
        <main>
          <Outlet />
        </main>
      </Container>
    </Box>
  );
}
