import { z } from "zod";
export declare const loginSchemaDTO: z.ZodObject<{
    email: z.ZodEmail;
    senha: z.ZodString;
}, z.core.$strip>;
export type LoginSchemaDTO = z.infer<typeof loginSchemaDTO>;
//# sourceMappingURL=AuthDTO.d.ts.map