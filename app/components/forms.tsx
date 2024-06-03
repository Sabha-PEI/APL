import {
	unstable_useControl as useControl,
	useInputControl
	
} from '@conform-to/react'
import type {FieldMetadata} from '@conform-to/react';
import React, { useId, useRef } from 'react'
import { Checkbox  } from './ui/checkbox.tsx'
import type {CheckboxProps} from './ui/checkbox.tsx';
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import { RadioGroup, RadioGroupItem } from './ui/radio-group.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
	
} from './ui/select.tsx'
import type {SelectProps} from './ui/select.tsx';
import { Slider } from './ui/slider.tsx'
import { Textarea } from './ui/textarea.tsx'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
	id,
	errors,
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null
	return (
		<ul id={id} className="flex flex-col gap-1">
			{errorsToRender.map(e => (
				<li key={e} className="text-[10px] text-foreground-destructive">
					{e}
				</li>
			))}
		</ul>
	)
}

export function Field({
	labelProps,
	inputProps,
	description,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: React.InputHTMLAttributes<HTMLInputElement>
	description?: React.ReactNode
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const isRequired = inputProps.required

	return (
		<div className={className}>
			<div className="flex items-start gap-1 pb-2">
				<Label htmlFor={id} {...labelProps} />
				{isRequired ? (
					<span className="text-sm leading-none">
						<span className="text-foreground-destructive">*</span>
						<span className="sr-only">Required</span>
					</span>
				) : null}
			</div>
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function TextareaField({
	labelProps,
	textareaProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = textareaProps.id ?? textareaProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const isRequired = textareaProps.required

	return (
		<div className={className}>
			<div className="flex items-start gap-1 pb-2">
				<Label htmlFor={id} {...labelProps} />
				{isRequired ? (
					<span className="text-sm leading-none">
						<span className="text-foreground-destructive">*</span>
						<span className="sr-only">Required</span>
					</span>
				) : null}
			</div>
			<Textarea
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...textareaProps}
			/>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function CheckboxField({
	labelProps,
	buttonProps,
	errors,
	className,
}: {
	labelProps: JSX.IntrinsicElements['label']
	buttonProps: CheckboxProps & {
		name: string
		form: string
		value?: string
	}
	errors?: ListOfErrors
	className?: string
}) {
	const { key, defaultChecked, ...checkboxProps } = buttonProps
	const fallbackId = useId()
	const checkedValue = buttonProps.value ?? 'on'
	const input = useInputControl({
		key,
		name: buttonProps.name,
		formId: buttonProps.form,
		initialValue: defaultChecked ? checkedValue : undefined,
	})
	const id = buttonProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const isRequired = buttonProps.required

	return (
		<div className={className}>
			<div className="flex gap-2">
				<Checkbox
					{...checkboxProps}
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					checked={input.value === checkedValue}
					onCheckedChange={state => {
						input.change(state.valueOf() ? checkedValue : '')
						buttonProps.onCheckedChange?.(state)
					}}
					onFocus={event => {
						input.focus()
						buttonProps.onFocus?.(event)
					}}
					onBlur={event => {
						input.blur()
						buttonProps.onBlur?.(event)
					}}
					type="button"
				/>
				<div className="flex items-start gap-1">
					<label
						{...labelProps}
						htmlFor={id}
						className="self-center text-body-xs text-muted-foreground"
					/>
					{isRequired ? (
						<span className="text-sm leading-none">
							<span className="text-foreground-destructive">*</span>
							<span className="sr-only">Required</span>
						</span>
					) : null}
				</div>
			</div>
			<div className="px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

interface SelectFieldProps
	extends SelectProps,
		Omit<
			React.HTMLAttributes<HTMLButtonElement>,
			'name' | 'defaultValue' | 'dir' | 'value'
		> {
	placeholder?: string
}
export function SelectField({
	labelProps,
	selectProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	selectProps: SelectFieldProps & {
		form: string
		name: string
	}
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const input = useInputControl({
		key: selectProps.name ?? fallbackId,
		formId: selectProps.form,
		name: selectProps.name,
		initialValue: selectProps.defaultValue,
	})
	const id = selectProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const isRequired = selectProps.required

	return (
		<div className={className}>
			<div className="flex items-start gap-1 pb-2">
				<Label {...labelProps} htmlFor={id} />
				{isRequired ? (
					<span className="text-sm leading-none">
						<span className="text-foreground-destructive">*</span>
						<span className="sr-only">Required</span>
					</span>
				) : null}
			</div>
			<Select
				{...selectProps}
				onValueChange={value => {
					input.change(value)
					selectProps.onValueChange?.(value)
				}}
			>
				<SelectTrigger
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					form={selectProps.form}
					onFocus={event => {
						input.focus()
						selectProps.onFocus?.(event)
					}}
					onBlur={event => {
						input.blur()
						selectProps.onBlur?.(event)
					}}
				>
					<SelectValue placeholder={selectProps.placeholder} />
				</SelectTrigger>
				<SelectContent>
					{selectProps.options.map(({ label, value }) => (
						<SelectItem key={label} value={value}>
							{label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function SliderField({
	labelProps,
	sliderProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	sliderProps: FieldMetadata<number>
	errors?: ListOfErrors
	className?: string
} & React.ComponentProps<typeof Slider>) {
	const sliderRef = useRef<React.ElementRef<typeof Slider>>(null)
	const control = useControl(sliderProps)
	const fallbackId = useId()
	const id = sliderProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const isRequired = sliderProps.required

	return (
		<div className={className}>
			<div className="flex items-start gap-1 pb-2">
				<Label {...labelProps} htmlFor={id} />
				{isRequired ? (
					<span className="text-sm leading-none">
						<span className="text-foreground-destructive">*</span>
						<span className="sr-only">Required</span>
					</span>
				) : null}
			</div>
			<input
				name={sliderProps.name}
				ref={control.register}
				defaultValue={sliderProps.initialValue}
				className="sr-only"
				tabIndex={-1}
				onFocus={() => {
					const sliderSpan = sliderRef.current?.querySelector('[role="slider"]')
					if (sliderSpan instanceof HTMLElement) {
						sliderSpan.focus()
					}
				}}
			/>
			<div className="flex items-center gap-4">
				<Slider
					{...sliderProps}
					max={sliderProps.max ? Number(sliderProps.max) : undefined}
					min={sliderProps.min ? Number(sliderProps.min) : undefined}
					step={sliderProps.step ? Number(sliderProps.step) : undefined}
					ref={sliderRef}
					aria-invalid={!!sliderProps.errors}
					value={[parseFloat(control.value ?? '0')]}
					onValueChange={value => {
						control.change(value[0].toString())
					}}
					onBlur={control.blur}
				/>
				<div>{control.value}</div>
			</div>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function RadioGroupField({
	labelProps,
	radiosProps,
	options,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	radiosProps: FieldMetadata<string>
	options: Array<{ value: string; label: string }>
	errors?: ListOfErrors
	className?: string
} & React.ComponentProps<typeof RadioGroup>) {
	const radioGroupRef = useRef<React.ElementRef<typeof RadioGroup>>(null)
	const control = useControl(radiosProps)
	const fallbackId = useId()
	const id = radiosProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const isRequired = radiosProps.required

	return (
		<div className={className}>
			<div className="flex items-start gap-1 pb-2">
				<Label {...labelProps} htmlFor={id} />
				{isRequired ? (
					<span className="text-sm leading-none">
						<span className="text-foreground-destructive">*</span>
						<span className="sr-only">Required</span>
					</span>
				) : null}
			</div>
			<input
				ref={control.register}
				name={radiosProps.name}
				defaultValue={radiosProps.initialValue}
				tabIndex={-1}
				className="sr-only"
				onFocus={() => {
					radioGroupRef.current?.focus()
				}}
			/>
			<RadioGroup
				ref={radioGroupRef}
				className="flex flex-wrap items-center gap-4"
				value={control.value ?? ''}
				onValueChange={control.change}
				onBlur={control.blur}
			>
				{options.map(option => {
					return (
						<div className="flex items-center gap-2" key={option.value}>
							<RadioGroupItem
								value={option.value}
								id={`${radiosProps.id}-${option.value}`}
							/>
							<label htmlFor={`${radiosProps.id}-${option.value}`}>
								{option.label}
							</label>
						</div>
					)
				})}
			</RadioGroup>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}
