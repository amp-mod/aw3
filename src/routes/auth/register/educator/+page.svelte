<script lang="ts">
	import {
		Loader,
		ArrowLeft,
		TriangleAlert,
		CheckCircle2,
		ShieldCheck,
		School,
		Globe,
		MapPin,
		Lock,
		Info,
		UserRound,
		GraduationCap,
		Link,
	} from '@lucide/svelte'
	import TwAdvanced from '../tw-advanced.svelte'
	import type { ActionData, PageData } from './$types'
	import { enhance } from '$app/forms'
	import Button from '$lib/components/Button.svelte'

	let { form, data }: { form: ActionData; data: PageData } = $props()

	let submitting = $state(false)
	let success = $state(false)
	let agreedToTerms = $state(false)

	// Form Data
	let fullName = $state('')
	let schoolName = $state('')
	let schoolEmail = $state('')
	let website = $state('')
	let username = $state('')
	let password = $state('')
	let country = $state('')
	let stateProvince = $state('')

	// Security checks
	let honeypot = $state('')
	let securityAnswer = $state('')

	const countries = [
		'United States',
		'Canada',
		'United Kingdom',
		'Australia',
		'Afghanistan',
		'Albania',
		'Algeria',
		'Andorra',
		'Angola',
		'Antigua and Barbuda',
		'Argentina',
		'Armenia',
		'Austria',
		'Azerbaijan',
		'Bahamas',
		'Bahrain',
		'Bangladesh',
		'Barbados',
		'Belarus',
		'Belgium',
		'Belize',
		'Benin',
		'Bhutan',
		'Bolivia',
		'Bosnia and Herzegovina',
		'Botswana',
		'Brazil',
		'Brunei',
		'Bulgaria',
		'Burkina Faso',
		'Burundi',
		'Cabo Verde',
		'Cambodia',
		'Cameroon',
		'Central African Republic',
		'Chad',
		'Chile',
		'China',
		'Colombia',
		'Comoros',
		'Congo',
		'Costa Rica',
		'Croatia',
		'Cuba',
		'Cyprus',
		'Czech Republic',
		'Denmark',
		'Djibouti',
		'Dominica',
		'Dominican Republic',
		'Ecuador',
		'Egypt',
		'El Salvador',
		'Equatorial Guinea',
		'Eritrea',
		'Estonia',
		'Eswatini',
		'Ethiopia',
		'Fiji',
		'Finland',
		'France',
		'Gabon',
		'Gambia',
		'Georgia',
		'Germany',
		'Ghana',
		'Greece',
		'Grenada',
		'Guatemala',
		'Guinea',
		'Guinea-Bissau',
		'Guyana',
		'Haiti',
		'Honduras',
		'Hungary',
		'Iceland',
		'India',
		'Indonesia',
		'Iran',
		'Iraq',
		'Ireland',
		'Israel',
		'Italy',
		'Jamaica',
		'Japan',
		'Jordan',
		'Kazakhstan',
		'Kenya',
		'Kiribati',
		// 'Korea, North', // Kim jong un. What are you doing here? For real though: North Korea obviously cannot access AmpMod, or any western website for that matter.
		'Korea, South',
		'Kosovo',
		'Kuwait',
		'Kyrgyzstan',
		'Laos',
		'Latvia',
		'Lebanon',
		'Lesotho',
		'Liberia',
		'Libya',
		'Liechtenstein',
		'Lithuania',
		'Luxembourg',
		'Madagascar',
		'Malawi',
		'Malaysia',
		'Maldives',
		'Mali',
		'Malta',
		'Marshall Islands',
		'Mauritania',
		'Mauritius',
		'Mexico',
		'Micronesia',
		'Moldova',
		'Monaco',
		'Mongolia',
		'Montenegro',
		'Morocco',
		'Mozambique',
		'Myanmar',
		'Namibia',
		'Nauru',
		'Nepal',
		'Netherlands',
		'New Zealand',
		'Nicaragua',
		'Niger',
		'Nigeria',
		'North Macedonia',
		'Norway',
		'Oman',
		'Pakistan',
		'Palau',
		'Palestine',
		'Panama',
		'Papua New Guinea',
		'Paraguay',
		'Peru',
		'Philippines',
		'Poland',
		'Portugal',
		'Qatar',
		'Romania',
		'Russia',
		'Rwanda',
		'Saint Kitts and Nevis',
		'Saint Lucia',
		'Saint Vincent',
		'Samoa',
		'San Marino',
		'Sao Tome and Principe',
		'Saudi Arabia',
		'Senegal',
		'Serbia',
		'Seychelles',
		'Sierra Leone',
		'Singapore',
		'Slovakia',
		'Slovenia',
		'Solomon Islands',
		'Somalia',
		'South Africa',
		'South Sudan',
		'Spain',
		'Sri Lanka',
		'Sudan',
		'Suriname',
		'Sweden',
		'Switzerland',
		'Syria',
		'Taiwan',
		'Tajikistan',
		'Tanzania',
		'Thailand',
		'Timor-Leste',
		'Togo',
		'Tonga',
		'Trinidad and Tobago',
		'Tunisia',
		'Turkey',
		'Turkmenistan',
		'Tuvalu',
		'Uganda',
		'Ukraine',
		'United Arab Emirates',
		'Uruguay',
		'Uzbekistan',
		'Vanuatu',
		'Vatican City',
		'Venezuela',
		'Vietnam',
		'Yemen',
		'Zambia',
		'Zimbabwe',
	]

	const usStates = [
		'Alabama',
		'Alaska',
		'Arizona',
		'Arkansas',
		'California',
		'Colorado',
		'Connecticut',
		'Delaware',
		'Florida',
		'Georgia',
		'Hawaii',
		'Idaho',
		'Illinois',
		'Indiana',
		'Iowa',
		'Kansas',
		'Kentucky',
		'Louisiana',
		'Maine',
		'Maryland',
		'Massachusetts',
		'Michigan',
		'Minnesota',
		'Mississippi',
		'Missouri',
		'Montana',
		'Nebraska',
		'Nevada',
		'New Hampshire',
		'New Jersey',
		'New Mexico',
		'New York',
		'North Carolina',
		'North Dakota',
		'Ohio',
		'Oklahoma',
		'Oregon',
		'Pennsylvania',
		'Rhode Island',
		'South Carolina',
		'South Dakota',
		'Tennessee',
		'Texas',
		'Utah',
		'Vermont',
		'Virginia',
		'Washington',
		'West Virginia',
		'Wisconsin',
		'Wyoming',
	]

	const isValid = $derived(
		fullName.length > 2 &&
			schoolName.length > 2 &&
			schoolEmail.includes('@') &&
			username.length >= 3 &&
			password.length >= 8 &&
			securityAnswer === 'teach' &&
			agreedToTerms &&
			country !== '',
	)

	const handleEnhance = () => {
		if (honeypot) return
		submitting = true
		return async ({ result, update }) => {
			submitting = false
			if (result.type === 'success') success = true
			await update()
		}
	}
</script>

<svelte:head>
	<title>Educator Registration - AmpMod</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-accent py-12 md:py-24">
	<a
		href="/auth/register"
		class="fixed top-0 left-0 flex items-center gap-3 p-3 font-bold text-white"
		aria-label="Back"><ArrowLeft /> Back to General signup</a
	>

	<div
		class="relative m-auto max-w-2xl rounded-xl bg-white p-6 shadow-xl md:p-10 dark:bg-neutral-800"
	>
		{#if !success}
			<div class="flex flex-col gap-8">
				<header class="text-center">
					<h1 class="text-3xl font-bold">Request a teacher account</h1>
					<p class="mt-2 text-neutral-500">
						Create a verified teacher account to manage classrooms and students. If you are not a
						teacher or other educator, please use our <a href="/auth/register" class="link"
							>general registration form</a
						>, which requires no personal information.
					</p>
				</header>

				<form
					method="POST"
					action="?/submitEducator"
					use:enhance={handleEnhance}
					class="flex flex-col gap-8"
				>
					<div class="sr-only h-0 overflow-hidden">
						<input type="text" bind:value={honeypot} name="hp_field" tabindex="-1" />
					</div>

					<section class="space-y-4">
						<div
							class="flex items-center gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-700"
						>
							<UserRound size={18} class="text-purple-600" />
							<h2 class="text-sm font-bold tracking-wider uppercase opacity-50">
								Professional Identity
							</h2>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<label class="flex flex-col gap-1 font-medium">
								Full Legal Name
								<input
									bind:value={fullName}
									name="fullName"
									type="text"
									class="input"
									placeholder="e.g., Dr. Isaac Newton"
									required
								/>
							</label>
							<label class="flex flex-col gap-1 font-medium">
								School / Organization
								<div class="relative">
									<School class="absolute top-1/2 left-3 -translate-y-1/2 opacity-30" size={16} />
									<input
										bind:value={schoolName}
										name="schoolName"
										type="text"
										class="input pl-10"
										placeholder="Cambridge Academy"
										required
									/>
								</div>
							</label>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<label class="flex flex-col gap-1 font-medium">
								Country
								<div class="relative">
									<Globe class="absolute top-1/2 left-3 -translate-y-1/2 opacity-30" size={16} />
									<select
										bind:value={country}
										name="country"
										class="input appearance-none pl-10"
										required
									>
										<option value="" disabled selected>Select...</option>
										{#each countries as c}
											<option value={c}>{c}</option>
										{/each}
									</select>
								</div>
							</label>
							{#if country === 'United States'}
								<label class="flex flex-col gap-1 font-medium">
									State
									<div class="relative">
										<MapPin class="absolute top-1/2 left-3 -translate-y-1/2 opacity-30" size={16} />
										<select
											bind:value={stateProvince}
											name="state"
											class="input appearance-none pl-10"
											required
										>
											<option value="" disabled selected>Select...</option>
											{#each usStates as s}
												<option value={s}>{s}</option>
											{/each}
										</select>
									</div>
								</label>
							{/if}
						</div>
					</section>

					<section class="space-y-4">
						<div
							class="flex items-center gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-700"
						>
							<Lock size={18} class="text-purple-600" />
							<h2 class="text-sm font-bold tracking-wider uppercase opacity-50">
								Account Security
							</h2>
						</div>

						<label class="flex flex-col gap-1 font-medium">
							Desired Username
							<input
								bind:value={username}
								name="username"
								type="text"
								class="input"
								placeholder="Unique name"
								required
							/>
							<div
								class="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[11px] leading-tight text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
							>
								<Info size={14} class="shrink-0" />
								<span
									><strong>PRIVACY:</strong> Do <u>not</u> use your real name or school name in your username.
									This will be public.</span
								>
							</div>
						</label>

						<label class="flex flex-col gap-1 font-medium">
							Account Password
							<input
								bind:value={password}
								name="password"
								type="password"
								class="input"
								placeholder="Minimum 8 characters"
								required
							/>
						</label>
					</section>

					<section class="space-y-4">
						<div
							class="flex items-center gap-2 border-b border-neutral-100 pb-2 dark:border-neutral-700"
						>
							<ShieldCheck size={18} class="text-purple-600" />
							<h2 class="text-sm font-bold tracking-wider uppercase opacity-50">
								Verification Credentials
							</h2>
						</div>

						<label class="flex flex-col gap-1 font-medium">
							Professional Email
							<input
								bind:value={schoolEmail}
								name="schoolEmail"
								type="email"
								class="input"
								placeholder="you@school.edu"
								required
							/>
						</label>

						<label class="flex flex-col gap-1 font-medium">
							Faculty Directory / Profile Link
							<div class="relative">
								<Link class="absolute top-1/2 left-3 -translate-y-1/2 opacity-30" size={16} />
								<input
									bind:value={website}
									name="website"
									type="url"
									class="input pl-10"
									placeholder="https://school.edu/staff/your-name"
									required
								/>
							</div>
						</label>

						<label class="flex flex-col gap-1 font-medium">
							Role Check: What is the primary job of an educator?
							<select bind:value={securityAnswer} class="input appearance-none">
								<option value="">Choose...</option>
								<option value="play">Playing games</option>
								<option value="teach">Teaching and supporting students</option>
								<option value="sleep">Sleeping</option>
							</select>
						</label>
					</section>

					<div class="space-y-4 pt-4">
						<label class="flex cursor-pointer items-start gap-3">
							<input
								type="checkbox"
								bind:checked={agreedToTerms}
								class="mt-1 h-5 w-5 accent-purple-600"
							/>
							<span class="text-xs opacity-70">
								I confirm I am a professional educator. Falsifying this information to gain teacher
								privileges is a violation of the Terms of Service.
							</span>
						</label>

						<Button
							type="submit"
							class="w-full py-4 text-lg font-bold"
							disabled={!isValid || submitting}
						>
							{#if submitting}<Loader class="animate-spin" size={20} />{:else}Submit Application{/if}
						</Button>
					</div>
				</form>

				{#if form?.message}
					<div class="flex items-center gap-2 rounded-xl bg-red-500/10 p-4 text-red-500">
						<TriangleAlert size={20} /> <span class="font-bold">{form.message}</span>
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col items-center gap-6 py-10 text-center">
				<div class="animate-bounce rounded-full bg-green-500 p-4 text-white shadow-lg">
					<CheckCircle2 size={48} />
				</div>
				<h2 class="text-4xl font-bold italic">Application Received</h2>
				<div class="space-y-2">
					<p class="text-neutral-500">
						Thank you, {fullName}. Your application for {schoolName} is being reviewed.
					</p>
					<p class="text-sm font-medium text-purple-600">Verification usually takes 24-48 hours.</p>
				</div>
				<Button href="/" class="mt-4 px-12">Return Home</Button>
			</div>
		{/if}
	</div>
</div>
