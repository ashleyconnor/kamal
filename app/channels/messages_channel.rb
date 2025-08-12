class MessagesChannel < ApplicationCable::Channel
  def subscribed
    stream_from "chat_room"

    # Broadcast updated online count
    broadcast_online_count

    # Notify others that user joined
    ActionCable.server.broadcast("chat_room", {
      type: "user_joined",
      user: {
        id: current_user.id,
        email: current_user.email_address
      },
      timestamp: Time.current.iso8601
    })
  end

  def unsubscribed
    # Broadcast updated online count
    broadcast_online_count

    # Notify others that user left
    ActionCable.server.broadcast("chat_room", {
      type: "user_left",
      user: {
        id: current_user.id,
        email: current_user.email_address
      },
      timestamp: Time.current.iso8601
    })
  end

  def speak(data)
    message_data = {
      type: "message",
      id: SecureRandom.uuid,
      content: data["message"],
      user: {
        id: current_user.id,
        email: current_user.email_address
      },
      timestamp: Time.current.iso8601
    }

    ActionCable.server.broadcast("chat_room", message_data)
  end

  def typing(data)
    ActionCable.server.broadcast("chat_room", {
      type: "typing",
      user: {
        id: current_user.id,
        email: current_user.email_address
      },
      is_typing: data["is_typing"]
    })
  end

  private

  def broadcast_online_count
    online_users = ActionCable.server.connections.map { |conn| [ conn.current_user.id, conn.current_user.email_address ] }.uniq

    ActionCable.server.broadcast("chat_room", {
      type: "online_count",
      count: online_users.count,
      users: online_users.map { |id, email|
        { id: id, email: email }
      }
    })
  end
end
