export interface Suggestion {
  id?: string
  suggestion?: string
  status?: 0 | 1
  pictures?: { url: string }[]
  creationTime?: string
}

export function getSuggestionList(params?: object) {
  return request<Suggestion[]>('/suggestion/list', {
    params: { status: 1, ...params },
  })
}

export function getSuggestion(id: Suggestion['id']) {
  return request<Suggestion>('/suggestion/getById', {
    params: { id },
  })
}

export function put(body: Suggestion) {
  return request('/suggestion/edit', {
    method: 'put',
    body,
  })
}

export function drop(id: Suggestion['id']) {
  return request('/suggestion/delete', {
    method: 'delete',
    params: { noMessage: true, id },
  })
}
