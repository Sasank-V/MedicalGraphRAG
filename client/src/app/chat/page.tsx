import NewChatPage from "@/components/NewChatPage"
import ProtectedLayout from "@/components/ProtectedLayout"

const NewChat = () => {
  return (
    <ProtectedLayout>
        <NewChatPage />
    </ProtectedLayout>
  )
}
export default NewChat