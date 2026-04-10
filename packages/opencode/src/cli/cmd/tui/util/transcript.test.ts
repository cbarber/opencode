import { expect, test } from "bun:test"
import type { Part, UserMessage } from "@opencode-ai/sdk/v2"
import { fetchTranscriptMessages } from "./transcript"

function makeMsg(id: string): { info: UserMessage; parts: Part[] } {
  return {
    info: { id, role: "user", sessionID: "ses_test", time: { created: 0 } } as UserMessage,
    parts: [{ type: "text", text: `content of ${id}`, synthetic: false }] as Part[],
  }
}

test("returns all messages the server provides, including pre-compaction ones", async () => {
  const serverMessages = Array.from({ length: 150 }, (_, i) => makeMsg(`msg_${i}`))
  const client = {
    session: {
      // Mirrors server behaviour: honours limit when provided, returns all when absent.
      messages: async (args: { sessionID: string; limit?: number }) => ({
        data: args.limit ? serverMessages.slice(0, args.limit) : serverMessages,
      }),
    },
  }

  const result = await fetchTranscriptMessages(client as any, "ses_test")

  expect(result).toHaveLength(150)
  expect(result[0].info.id).toBe("msg_0")
  expect(result[149].info.id).toBe("msg_149")
})
