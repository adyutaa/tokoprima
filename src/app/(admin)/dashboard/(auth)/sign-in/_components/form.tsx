"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { SignIn } from "../lib/actions";
import { ActionResult } from "@/types";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const initialState: ActionResult = {
	error: "",
};

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" className="w-full" disabled={pending}>
			{pending ? "Loading..." : "Sign in"}
		</Button>
	);
}

export default function FormSignIn() {
	const [state, formAction] = useFormState(SignIn, initialState);

	return (
		<form action={formAction}>
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Login</CardTitle>
					<CardDescription>
						Enter your email below to login to your account.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							name="email"
							id="email"
							type="email"
							placeholder="m@example.com"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Password</Label>
						<Input name="password" id="password" type="password" />
					</div>
				</CardContent>
				<CardFooter>
					<SubmitButton />
				</CardFooter>
			</Card>
		</form>
	);
}
