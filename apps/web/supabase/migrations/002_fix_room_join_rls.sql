-- Fix: guests couldn't join rooms because guest_id was NULL when they tried to update.
-- Allow any authenticated user to set guest_id on a waiting room (joining).
-- Participants (host or guest) can still update rooms they belong to.

drop policy "Participants can update rooms" on rooms;

create policy "Participants or joiners can update rooms"
  on rooms for update using (
    auth.uid() = host_id
    or auth.uid() = guest_id
    or (guest_id is null and status = 'waiting')
  );
