import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResourceLink {
  name: string
  url: string
  description: string
  category: 'application' | 'school-finder' | 'general'
}

const externalLinks: ResourceLink[] = [
  {
    name: 'PTCAS',
    url: 'https://ptcas.liaisoncas.com/',
    description: 'Physical Therapist Centralized Application Service',
    category: 'application',
  },
  {
    name: 'APTA - Find a PT Program',
    url: 'https://aptaeducation.org/find-a-program/',
    description: 'American Physical Therapy Association program finder',
    category: 'school-finder',
  },
  {
    name: 'CAPTE - Accredited Programs',
    url: 'https://www.capteonline.org/',
    description: 'Commission on Accreditation in Physical Therapy Education',
    category: 'school-finder',
  },
  {
    name: 'APTA Student Resources',
    url: 'https://www.apta.org/your-career/students',
    description: 'Resources for prospective and current PT students',
    category: 'general',
  },
  {
    name: 'PTCAS Help Center',
    url: 'https://help.liaisonedu.com/ptcas/',
    description: 'PTCAS application help and FAQ',
    category: 'application',
  },
]

const markdownFiles = [
  { id: 'personal-statement', name: 'Personal Statement Guide', path: '/resources/personal-statement.md' },
  { id: 'interview-tips', name: 'Interview Tips', path: '/resources/interview-tips.md' },
]

export default function Resources() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [markdownContent, setMarkdownContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLinks = externalLinks.filter((link) => {
    const query = searchQuery.toLowerCase()
    return (
      link.name.toLowerCase().includes(query) ||
      link.description.toLowerCase().includes(query) ||
      link.category.toLowerCase().includes(query)
    )
  })

  useEffect(() => {
    if (selectedFile) {
      loadMarkdownFile(selectedFile)
    }
  }, [selectedFile])

  const loadMarkdownFile = async (fileId: string) => {
    const file = markdownFiles.find((f) => f.id === fileId)
    if (!file) return

    setLoading(true)
    try {
      const response = await fetch(file.path)
      if (!response.ok) {
        throw new Error('Failed to load markdown file')
      }
      const content = await response.text()
      setMarkdownContent(content)
    } catch (error) {
      console.error('Error loading markdown file:', error)
      setMarkdownContent('# Error\n\nFailed to load the markdown file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Resources & Tips</h1>
      <p className="text-muted-foreground mb-6">
        Helpful resources and tips for your DPT journey
      </p>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Markdown Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Guides & Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {markdownFiles.map((file) => (
                <Button
                  key={file.id}
                  variant={selectedFile === file.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedFile(file.id)}
                >
                  {file.name}
                </Button>
              ))}
            </div>

            {selectedFile && (
              <div className="mt-6 border-t pt-6">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {markdownContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* External Links */}
        <Card>
          <CardHeader>
            <CardTitle>External Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No links found matching your search
                </p>
              ) : (
                filteredLinks.map((link) => (
                  <Card key={link.url} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{link.name}</h4>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded capitalize">
                            {link.category.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {link.description}
                        </p>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {link.url}
                        </a>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

