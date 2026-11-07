<script lang="ts">
	import {
		AppShell,
		Banner,
		Button,
		Card,
		CheckboxField,
		DateRangeField,
		EmptyState,
		ListRow,
		ProgressBar,
		SelectField,
		SessionSlot,
		StatusChip,
		TextField,
		TimeRangeField
	} from '#lib/ui/index.js';
	import SetupChecklist from '#lib/components/SetupChecklist.svelte';

	let theme = $state<'light' | 'dark'>('light');
	let dir = $state<'ltr' | 'rtl'>('ltr');
	let name = $state('Star');
	let sessions = $state(7);
	let level = $state('beginner');
	let beginner = $state(true);
	let opens = $state('18:00');
	let closes = $state('22:00');
	let closedFrom = $state('');
	let closedTo = $state('');
	const ar = $derived(dir === 'rtl');
</script>

<svelte:head><title>sijjel design system</title></svelte:head>

<div class="controls">
	<Button variant="secondary" onclick={() => (theme = theme === 'light' ? 'dark' : 'light')}
		>Theme: {theme}</Button
	>
	<Button variant="secondary" onclick={() => (dir = dir === 'ltr' ? 'rtl' : 'ltr')}
		>Direction: {dir}</Button
	>
</div>

<div data-theme={theme} {dir} class="preview">
	<AppShell
		brand={{ name: ar ? 'أكاديمية الفارس' : 'Al Faris Academy', mark: ar ? 'ف' : 'AF' }}
		nav={[
			{ href: '/design', label: ar ? 'الحجز' : 'Book', icon: 'event' },
			{ href: '/design/bookings', label: ar ? 'حجوزاتي' : 'My bookings', icon: 'receipt_long' },
			{ href: '/design/account', label: ar ? 'حسابي' : 'Account', icon: 'person' }
		]}
		current="/design"
	>
		{#snippet actions()}<Button variant="quiet">{ar ? 'English' : 'العربية'}</Button>{/snippet}
		{#snippet footer()}{ar ? 'مدعوم من سجّل' : 'Powered by sijjel'}{/snippet}

		<div class="sj-page">
			<h1 class="display">{ar ? 'احجز ركوبتك المسائية' : 'Book your evening ride'}</h1>

			<Card>
				<h2 class="heading">Buttons</h2>
				<div class="sj-row">
					<Button>{ar ? 'احجز 19:00' : 'Book 19:00'}</Button>
					<Button variant="secondary">{ar ? 'غيّر التاريخ' : 'Change date'}</Button>
					<Button variant="quiet">{ar ? 'قواعد الإسطبل' : 'View house rules'}</Button>
					<Button variant="danger">{ar ? 'إلغاء الحجز' : 'Cancel booking'}</Button>
					<Button disabled>{ar ? 'احجز 20:00' : 'Book 20:00'}</Button>
					<Button variant="secondary" icon="arrow_forward" label="Next" />
				</div>
			</Card>

			<Card>
				<h2 class="heading">Fields</h2>
				<TextField
					label={ar ? 'اسم الحصان' : 'Horse name'}
					bind:value={name}
					hint="Shown to trainers on the planning board."
				/>
				<TextField
					label={ar ? 'الحصص في اليوم' : 'Sessions per day'}
					type="number"
					bind:value={sessions}
					error="Choose between 1 and 6 sessions."
				/>
				<SelectField
					label={ar ? 'المستوى' : 'Rider level'}
					bind:value={level}
					options={[
						{ value: 'beginner', label: ar ? 'مبتدئ' : 'Beginner' },
						{ value: 'novice', label: ar ? 'مستجد' : 'Novice' }
					]}
				/>
				<CheckboxField label={ar ? 'مناسب للمبتدئين' : 'Suits beginners'} bind:checked={beginner} />
			</Card>

			<Card>
				<h2 class="heading">Chips</h2>
				<div class="sj-row">
					<StatusChip tone="pending" dot>{ar ? 'بانتظار التأكيد' : 'Pending'}</StatusChip>
					<StatusChip tone="active" dot>{ar ? 'فعّال' : 'Active'}</StatusChip>
					<StatusChip tone="stone" dot>{ar ? 'موقوف' : 'Suspended'}</StatusChip>
					<StatusChip tone="danger" dot>{ar ? 'غير متاح اليوم' : 'Unavailable today'}</StatusChip>
					<StatusChip tone="level">{ar ? 'الترويض · مبتدئ' : 'Dressage · Novice'}</StatusChip>
					<StatusChip>{ar ? 'مدرّب' : 'Trainer'}</StatusChip>
				</div>
			</Card>

			<div class="sj-stack">
				<SessionSlot
					start="18:00"
					end="19:00"
					endLabel="to 19:00"
					placesLeft={5}
					capacity={8}
					horsesFree={2}
					horsesTotal={3}
					state="open"
					placesLabel="5 of 8 places left"
					note="2 school horses free for your level"
				>
					{#snippet action()}<Button>Book</Button>{/snippet}
				</SessionSlot>
				<SessionSlot
					start="19:00"
					end="20:00"
					endLabel="to 20:00"
					placesLeft={3}
					capacity={8}
					horsesFree={1}
					horsesTotal={3}
					state="last-horse"
					placesLabel="3 of 8 places left"
					note="Last school horse for your level"
				>
					{#snippet action()}<Button>Book</Button>{/snippet}
				</SessionSlot>
				<SessionSlot
					start="20:00"
					end="21:00"
					endLabel="to 21:00"
					placesLeft={4}
					capacity={8}
					horsesFree={0}
					horsesTotal={2}
					state="no-horse"
					placesLabel="4 of 8 places left"
					note="No suitable school horse. You can still bring your own."
				>
					{#snippet action()}<Button variant="secondary">Book with my horse</Button>{/snippet}
				</SessionSlot>
				<SessionSlot
					start="21:00"
					end="22:00"
					endLabel="to 22:00"
					placesLeft={2}
					capacity={8}
					horsesFree={1}
					horsesTotal={2}
					state="booked"
					placesLabel="Booked for you"
					note="You can cancel until 09:00"
				>
					{#snippet action()}<Button variant="quiet">Cancel</Button>{/snippet}
				</SessionSlot>
				<SessionSlot
					start="21:30"
					end="22:00"
					endLabel="to 22:00"
					placesLeft={0}
					capacity={0}
					horsesFree={0}
					horsesTotal={0}
					state="few"
					note="2 places left"
					compact
				>
					{#snippet action()}<Button>Book</Button>{/snippet}
				</SessionSlot>
			</div>

			<div class="sj-list">
				<ListRow initials="LA" title="Layla Ahmed" subtitle="layla.ahmed@example.com" highlight>
					{#snippet trailing()}<StatusChip tone="pending" dot>Pending</StatusChip><Button
							>Confirm</Button
						>{/snippet}
				</ListRow>
				<ListRow initials="OK" title="Omar Khalid" subtitle="omar.k@example.com">
					{#snippet trailing()}<StatusChip tone="level">Show jumping · 80 cm</StatusChip><Button
							variant="secondary"
							icon="edit"
							label="Edit Omar Khalid"
						/>{/snippet}
				</ListRow>
			</div>

			<Banner tone="pending" icon="hourglass_top"
				><strong>Waiting for confirmation.</strong> Al Faris Academy will confirm your level.</Banner
			>
			<Banner icon="check_circle"
				><strong>Booked.</strong> Thursday at 19:00 in the main arena.</Banner
			>
			<Banner tone="danger" icon="wifi_off"
				><strong>We can't reach sijjel right now.</strong> Check your connection and try again.</Banner
			>

			<Card>
				<EmptyState icon="horseshoe" title="No horses yet">
					Add your school horses and the levels each one can carry.
					{#snippet action()}<Button icon="add">Add a horse</Button>{/snippet}
				</EmptyState>
			</Card>

			<SetupChecklist
				state={{
					hours: { done: true },
					arenas: { done: false },
					horses: { done: false },
					plans: { done: false }
				}}
				academyName="Al Faris Academy"
			/>

			<Card>
				<h2 class="heading">Time and date ranges</h2>
				<ProgressBar value={2} max={3} label="2 of 3 done" />
				<TimeRangeField label="Saturday" bind:opens bind:closes />
				<DateRangeField label="Closed" bind:from={closedFrom} bind:to={closedTo} />
			</Card>
		</div>
	</AppShell>
</div>

<style>
	.controls {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: var(--surface-sunk);
	}
	.preview {
		background: var(--ground);
		color: var(--ink);
	}
</style>
