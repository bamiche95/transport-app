import React from "react";
import WTNRecipientsTable from "@/app/components/WTNRecipientsTable";
import { Container } from "@mui/material";

export default function Page() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <WTNRecipientsTable />
    </Container>
  );
}
