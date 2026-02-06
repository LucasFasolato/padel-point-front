// src/app/test/page.tsx
'use client';

import { Skeleton } from '@/app/components/ui/skeleton';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';

export default function TestPage() {
  return (
    <div className="container mx-auto max-w-2xl space-y-8 py-8">
      <h1 className="text-2xl font-bold">Test de componentes</h1>

      <div>
        <h2 className="mb-2 font-semibold">Skeleton</h2>
        <Skeleton className="h-12 w-full" />
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Label + Textarea</h2>
        <Label>Mensaje</Label>
        <Textarea placeholder="Escribe algo..." />
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Radio Group</h2>
        <RadioGroup defaultValue="1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1" id="r1" />
            <Label htmlFor="r1">Opción 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2" id="r2" />
            <Label htmlFor="r2">Opción 2</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Tabs</h2>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Contenido 1</TabsContent>
          <TabsContent value="tab2">Contenido 2</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}