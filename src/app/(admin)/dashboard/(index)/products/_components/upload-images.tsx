import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import Image from "next/image";
import React, { ChangeEvent, useRef } from "react";

export default function UploadImages() {
  const ref = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLImageElement>(null);
  const imageFirstRef = useRef<HTMLImageElement>(null);
  const imageSecondRef = useRef<HTMLImageElement>(null);

  const openFolder = () => {
    if (ref.current) {
      ref.current.click();
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!thumbnailRef.current || !imageFirstRef.current || !imageSecondRef.current) {
      return;
    }

    if (e.target.files && e.target.files.length >= 3) {
      thumbnailRef.current.src = URL.createObjectURL(e.target.files[0]);
      imageFirstRef.current.src = URL.createObjectURL(e.target.files[1]);
      imageSecondRef.current.src = URL.createObjectURL(e.target.files[2]);
    }
  };

  return (
    <Card className="overflow-hidden" x-chunk="dashboard-07-chunk-4">
      <CardHeader>
        <CardTitle>Product Images</CardTitle>
        <CardDescription>Lipsum dolor sit amet, consectetur adipiscing elit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <Image alt="Product image" className="aspect-square w-full rounded-md object-cover" height="300" src="/placeholder.svg" width="300" ref={thumbnailRef} />
          <div className="grid grid-cols-3 gap-2">
            <button>
              <Image alt="Product image" className="aspect-square w-full rounded-md object-cover" height="84" src="/placeholder.svg" width="84" ref={imageFirstRef} />
            </button>
            <button>
              <Image alt="Product image" className="aspect-square w-full rounded-md object-cover" height="84" src="/placeholder.svg" width="84" ref={imageSecondRef} />
            </button>
            <button type="button" onClick={openFolder} className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Upload</span>
            </button>
            <input ref={ref} onChange={onChange} type="file" name="images" className="hidden" accept="images/*" multiple />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
