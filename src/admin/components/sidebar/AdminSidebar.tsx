import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { adminNavItems } from "../../config/navigation"

interface AdminSidebarProps {
  isOpen: boolean
}

const AdminSidebar = ({ isOpen }: AdminSidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedItems, setExpandedItems] = useState<string[]>([])


  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const handleItemClick = (item: any, e: React.MouseEvent) => {
    if (!isOpen) {
      e.preventDefault()
      if (item.children && item.children.length > 0) {
        navigate(item.children[0].path)
      } else {
        navigate(item.path)
      }
    } else if (item.children) {
      e.preventDefault()
      toggleExpand(item.id)
    }
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r transition-all duration-300 z-40",
        isOpen ? "w-64" : "w-20 md:w-20 hidden md:block",
      )}
    >
      <nav className="h-full py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            const isExpanded = expandedItems.includes(item.id)

            return (
              <li key={item.id}>
                <div className="relative">
                  <Link
                    to={item.path}
                    onClick={(e) => handleItemClick(item, e)}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#197874] text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      !isOpen && "justify-center",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isOpen && "mr-3")} />
                    {isOpen && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        {item.children && (
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform", isExpanded && "transform rotate-180")}
                          />
                        )}
                      </>
                    )}
                  </Link>

                  {isOpen && item.children && isExpanded && (
                    <ul className="mt-1 ml-6 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            to={child.path}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
                              location.pathname === child.path
                                ? "bg-[#197874] text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default AdminSidebar