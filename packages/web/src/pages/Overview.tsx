import { Heading, Text } from "@radix-ui/themes";

export function Overview() {
  return (
    <>
      <Heading size="6" mb="2">
        Overview
      </Heading>
      <Text as="p" color="gray">
        {/* logic goes here */}
        Landing page for open-air requirements management.
      </Text>
    </>
  );
}
