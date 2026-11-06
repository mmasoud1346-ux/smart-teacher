import { createHashRouter } from 'react-router'
import DashboardPage from '../App'
import SectionPage from '../pages/SectionPage'

export const router = createHashRouter([
  { path: '/', Component: DashboardPage },
  { path: '/tools', element: <SectionPage section="tools" /> },
  { path: '/courses', element: <SectionPage section="courses" /> },
  { path: '/resources', element: <SectionPage section="resources" /> },
  { path: '/blog', element: <SectionPage section="blog" /> },
  { path: '*', element: <SectionPage section="not-found" /> },
])
