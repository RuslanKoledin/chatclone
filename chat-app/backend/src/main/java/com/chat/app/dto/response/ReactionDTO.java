package com.chat.app.dto.response;

import com.chat.app.model.Reaction;
import lombok.Builder;

import java.util.*;
import java.util.stream.Collectors;

@Builder
public record ReactionDTO(UUID id, String emoji, UUID userId, String userName) {

    public static ReactionDTO fromReaction(Reaction reaction) {
        if (Objects.isNull(reaction)) return null;
        return ReactionDTO.builder()
                .id(reaction.getId())
                .emoji(reaction.getEmoji())
                .userId(reaction.getUser().getId())
                .userName(reaction.getUser().getFullName())
                .build();
    }

    public static List<ReactionDTO> fromReactions(Collection<Reaction> reactions) {
        if (Objects.isNull(reactions)) return List.of();
        return reactions.stream()
                .map(ReactionDTO::fromReaction)
                .toList();
    }

    // Группируем реакции по emoji для отображения: "👍": [{userId, userName}, ...]
    public static Map<String, List<ReactionDTO>> groupByEmoji(Collection<Reaction> reactions) {
        if (Objects.isNull(reactions)) return Map.of();
        return reactions.stream()
                .map(ReactionDTO::fromReaction)
                .collect(Collectors.groupingBy(ReactionDTO::emoji));
    }

}
