"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Chip,
  Stack,
  Alert
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs, { Dayjs } from "dayjs";
import {toast} from "react-toastify";
interface JobDetail {
  job_id: number;
  customer_name: string;
  job_date: string;
}

export default function ScheduleJob({ job }: { job: JobDetail }) {
  const [open, setOpen] = React.useState(false);
  const [selectedDates, setSelectedDates] = React.useState<Dayjs[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const toggleDate = (date: Dayjs) => {
    setSelectedDates(prev => {
      const exists = prev.some(d => d.isSame(date, "day"));
      return exists
        ? prev.filter(d => !d.isSame(date, "day"))
        : [...prev, date];
    });
  };

  const handleCreateSchedule = async () => {
    if (selectedDates.length === 0) {
      setError("Please select at least one date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: job.job_id,
          dates: selectedDates.map(d => d.format("YYYY-MM-DD HH:mm:ss"))
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to schedule jobs");
      }

      setOpen(false);
      setSelectedDates([]);
      toast.success(`${selectedDates.length} jobs scheduled successfully`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Schedule Job
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Job</DialogTitle>

        <DialogContent>
          <Typography gutterBottom>
            Replicate job for <b>{job.customer_name}</b>
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <DateCalendar
            minDate={dayjs().startOf("day")}
            onChange={(date) => date && toggleDate(date)}
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
            {selectedDates.map(d => (
              <Chip
                key={d.toString()}
                label={d.format("DD MMM YYYY")}
                onDelete={() => toggleDate(d)}
              />
            ))}
          </Stack>

          <Typography variant="caption" mt={2} display="block">
            {selectedDates.length} job(s) will be created
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
       <Button
  variant="contained"
  disabled={loading}
  onClick={handleCreateSchedule}
>
  {loading ? "Scheduling..." : "Create Schedule"}
</Button>

        </DialogActions>
      </Dialog>
    </>
  );
}
