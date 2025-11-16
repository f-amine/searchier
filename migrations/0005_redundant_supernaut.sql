CREATE TABLE "search_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"store_id" text NOT NULL,
	"type" text NOT NULL,
	"query" text,
	"results_count" integer,
	"product_id" text,
	"product_name" text,
	"product_slug" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "search_event" ADD CONSTRAINT "search_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;