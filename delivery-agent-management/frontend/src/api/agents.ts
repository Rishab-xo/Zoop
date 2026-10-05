import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
})

export interface Agent {
  id: string
  fullName: string
  phone: string
  email: string
  serviceArea: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export interface AgentListResponse {
  data: Agent[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AgentFilters {
  page?: number
  limit?: number
  status?: 'ACTIVE' | 'INACTIVE' | ''
  q?: string
}

export interface CreateAgentInput {
  fullName: string
  phone: string
  email: string
  serviceArea: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export type UpdateAgentInput = Partial<CreateAgentInput>

export const agentApi = {
  list: async (filters: AgentFilters = {}): Promise<AgentListResponse> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
    )
    const res = await api.get<AgentListResponse>('/agents', { params })
    return res.data
  },

  get: async (id: string): Promise<Agent> => {
    const res = await api.get<Agent>(`/agents/${id}`)
    return res.data
  },

  create: async (data: CreateAgentInput): Promise<Agent> => {
    const res = await api.post<Agent>('/agents', data)
    return res.data
  },

  update: async (id: string, data: UpdateAgentInput): Promise<Agent> => {
    const res = await api.patch<Agent>(`/agents/${id}`, data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/agents/${id}`)
  },
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message ?? err.message
  }
  return 'An unexpected error occurred'
}
