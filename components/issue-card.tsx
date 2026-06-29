import { formatDate, getCategoryIcon, getSeverityColor, getStatusColor } from "@/lib/utils"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { MapPin, ThumbsUp, MessageCircle } from "lucide-react"
import Link from "next/link"

interface IssueCardProps {
  issue: any
}

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <Link href={`/issues/${issue.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-0">
          <div className="relative">
            <img
              src={issue.imageUrl}
              alt={issue.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            
            <div className="absolute top-2 right-2 text-2xl">
              {getCategoryIcon(issue.category)}
            </div>
          </div>

          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {issue.title}
            </h3>

            <div className="flex gap-1.5">
              <Badge className={getSeverityColor(issue.severity)}>
                {issue.severity}
              </Badge>
              <Badge className={getStatusColor(issue.status)}>
                {issue.status}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">
              {issue.description}
            </p>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              <span className="truncate">{issue.address}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp size={11} />
                  {issue._count?.votes ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} />
                  {issue._count?.comments ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{issue.user?.name}</span>
                <span>·</span>
                <span>{formatDate(issue.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}