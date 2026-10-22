-- SIM-05/SIM-06: Idempotent furniture and appliance catalog rows.
begin;

insert into public.furniture_types (id, name, sprite_key, in_tray, sort_order, active)
values
  ('bed', 'Bed', 'bed', true, 1, true),
  ('sofa', 'Sofa', 'sofa', true, 2, true),
  ('table', 'Table', 'table', true, 3, true),
  ('toilet', 'Toilet', 'toilet', true, 4, true),
  ('sink', 'Sink', 'sink', true, 5, true)
on conflict (id) do update set
  name = excluded.name,
  sprite_key = excluded.sprite_key,
  in_tray = excluded.in_tray,
  sort_order = excluded.sort_order,
  active = excluded.active;

insert into public.appliance_types (
  id, name, sprite_key, always_on, needs_person, has_star_rating,
  swap_eligible, in_tray, sort_order, active
)
values
  ('router', 'Wi-Fi Router', 'router', true, false, false, false, true, 7, true),
  ('washing_machine', 'Washing Machine', 'washing_machine', false, true, true, true, true, 9, true),
  ('light_bulb', 'Ceiling Light', 'light_bulb', false, true, true, false, true, 10, true)
on conflict (id) do update set
  name = excluded.name,
  sprite_key = excluded.sprite_key,
  always_on = excluded.always_on,
  needs_person = excluded.needs_person,
  has_star_rating = excluded.has_star_rating,
  swap_eligible = excluded.swap_eligible,
  in_tray = excluded.in_tray,
  sort_order = excluded.sort_order,
  active = excluded.active;

commit;
